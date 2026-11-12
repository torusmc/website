# Deploying the TorusMC website

Target: a Debian server with **Docker** and **Nginx** already installed,
with **Cloudflare** as the DNS provider (proxied, "orange cloud").

```
Visitor ──▶ Cloudflare ──443──▶ Nginx (host, SSL) ──▶ 127.0.0.1:3000 ──▶ Docker container (Next.js)
```

| File                          | Purpose                                              |
| ----------------------------- | ---------------------------------------------------- |
| `Dockerfile`                  | Builds the production image (Next.js standalone)     |
| `Dockerfile.dockerignore`     | Keeps `node_modules`, `.next`, secrets out of builds |
| `compose.yaml`                | Runs the container, bound to `127.0.0.1:3000` only   |
| `nginx/torusmc.com.conf`      | Nginx site: HTTPS, `www` → apex redirect, proxy      |
| `nginx/update-cloudflare-ips.sh` | Makes Nginx see real visitor IPs behind Cloudflare |

All commands below run **on the server** unless marked *local*. Replace
`user@SERVER_IP` with your SSH login.

---

## 1. Point the domain at the server (Cloudflare DNS)

In the Cloudflare dashboard → **torusmc.com** → **DNS** → **Records**, add:

| Type   | Name  | Content              | Proxy status     |
| ------ | ----- | -------------------- | ---------------- |
| `A`    | `@`   | your server's IPv4   | Proxied (orange) |
| `A`    | `www` | your server's IPv4   | Proxied (orange) |
| `AAAA` | `@`   | server IPv6 (if any) | Proxied (orange) |
| `AAAA` | `www` | server IPv6 (if any) | Proxied (orange) |

Find the server's IPs with `curl -4 ifconfig.me` and `curl -6 ifconfig.me`.

> Leave the records for `torusmc.net` (the Minecraft server) as they are.
> Minecraft traffic can't go through Cloudflare's proxy, so any Minecraft
> record must stay **DNS only** (grey cloud).

Because the records are proxied, `dig +short torusmc.com` returns
Cloudflare IPs, not your server's. That's expected.

Then, still in Cloudflare:

- **SSL/TLS → Overview → encryption mode: `Full (strict)`.** (After step 4
  the server has a valid certificate. `Flexible` would cause a redirect loop
  with this Nginx config.)
- **SSL/TLS → Edge Certificates:** turn on **Always Use HTTPS**.
- **Security → Bots:** if you enable Bot Fight Mode and the Discord card
  stops showing, turn it off. Discord's preview bot has to be able to fetch
  the page.

## 2. Open the firewall

If you use `ufw`:

```bash
sudo ufw allow 'Nginx Full'   # ports 80 and 443
sudo ufw status
```

Optionally, allow 80/443 only from Cloudflare's IP ranges
(https://www.cloudflare.com/ips/) so nobody can reach the origin directly.

Port 3000 does **not** need to be opened — the container only listens on
localhost.

## 3. Upload the website and start the container

*Local* — copy the project to the server (from the project root):

```bash
rsync -av --delete \
  --exclude node_modules --exclude .next --exclude '.env*' \
  ./ user@SERVER_IP:/opt/torusmc-website/
```

*(If the project is in a Git repository, `git clone` it into
`/opt/torusmc-website` on the server instead.)*

On the server:

```bash
sudo chown -R "$USER":"$USER" /opt/torusmc-website
cd /opt/torusmc-website
docker compose -f Deployment/compose.yaml up -d --build
```

Check that it runs:

```bash
docker compose -f Deployment/compose.yaml ps
curl -I http://127.0.0.1:3000      # expect HTTP/1.1 200
```

## 4. Generate the SSL certificate (Let's Encrypt via Cloudflare DNS)

Certbot proves domain ownership by creating a temporary DNS record through
the Cloudflare API (DNS-01 challenge). This works with the proxy on and
doesn't need port 80.

**Create an API token:** Cloudflare dashboard → profile icon → **My Profile**
→ **API Tokens** → **Create Token** → template **Edit zone DNS** →
*Zone Resources:* Include → Specific zone → `torusmc.com` → create, then
copy the token.

On the server:

```bash
sudo apt update
sudo apt install -y certbot python3-certbot-dns-cloudflare

# Store the token (readable by root only)
sudo mkdir -p /etc/letsencrypt
echo 'dns_cloudflare_api_token = PASTE_YOUR_TOKEN_HERE' | sudo tee /etc/letsencrypt/cloudflare.ini >/dev/null
sudo chmod 600 /etc/letsencrypt/cloudflare.ini
```

Request the certificate for both names:

```bash
sudo certbot certonly \
  --dns-cloudflare \
  --dns-cloudflare-credentials /etc/letsencrypt/cloudflare.ini \
  --dns-cloudflare-propagation-seconds 30 \
  -d torusmc.com -d www.torusmc.com \
  --agree-tos -m YOUR_EMAIL@example.com --no-eff-email \
  --deploy-hook "systemctl reload nginx"
```

The certificate lands in `/etc/letsencrypt/live/torusmc.com/`.

**Automatic renewal:** Debian's certbot package installs a systemd timer
that renews certificates before they expire, using the same Cloudflare
token. The `--deploy-hook` above reloads Nginx after each renewal. Verify
both:

```bash
systemctl list-timers | grep certbot
sudo certbot renew --dry-run
```

## 5. Enable the Nginx site

First, make Nginx use the real visitor IP from Cloudflare's
`CF-Connecting-IP` header. Without this, logs and the app see only
Cloudflare's IPs:

```bash
sudo /opt/torusmc-website/Deployment/nginx/update-cloudflare-ips.sh

# Refresh Cloudflare's IP list weekly
echo '0 4 * * 1 root /opt/torusmc-website/Deployment/nginx/update-cloudflare-ips.sh >/dev/null' \
  | sudo tee /etc/cron.d/cloudflare-realip >/dev/null
```

Then enable the site:

```bash
sudo cp /opt/torusmc-website/Deployment/nginx/torusmc.com.conf \
        /etc/nginx/sites-available/torusmc.com
sudo ln -sf /etc/nginx/sites-available/torusmc.com /etc/nginx/sites-enabled/torusmc.com

# Optional: disable Debian's placeholder "Welcome to nginx" site
sudo rm -f /etc/nginx/sites-enabled/default

sudo nginx -t && sudo systemctl reload nginx
```

> On Nginx 1.25.1+ `nginx -t` warns that `listen … http2` is deprecated.
> That is harmless; to silence it, change `listen 443 ssl http2;` to
> `listen 443 ssl;` plus a separate `http2 on;` line (same for `[::]:443`).
> Check your version with `nginx -v`.

## 6. Check it

```bash
curl -I https://torusmc.com          # 200
curl -I http://torusmc.com           # 301 → https://torusmc.com/
curl -I https://www.torusmc.com      # 301 → https://torusmc.com/
```

Then open https://torusmc.com in a browser. To check the Discord card,
paste `https://torusmc.com` in a Discord channel.

---

## Updating the website

*Local:* run the `rsync` command from step 3 again. Then on the server:

```bash
cd /opt/torusmc-website
docker compose -f Deployment/compose.yaml up -d --build
docker image prune -f      # remove the old image
```

Nginx and the certificate don't need to be touched for updates. If a
change doesn't show up, purge the cache in Cloudflare (**Caching →
Configuration → Purge Everything**).

> Discord caches link previews. After changing the embed, it can take a
> while for Discord to show the new version of an already-posted link.

## Useful commands

```bash
docker compose -f Deployment/compose.yaml logs -f     # app logs
docker compose -f Deployment/compose.yaml restart     # restart the app
docker compose -f Deployment/compose.yaml down        # stop the app
sudo tail -f /var/log/nginx/error.log                 # Nginx errors
sudo certbot certificates                             # certificate expiry
```

## Troubleshooting

- **`502 Bad Gateway`** — the container isn't running or still starting.
  Check `docker compose -f Deployment/compose.yaml ps` and the logs.
- **Certbot fails with an authentication error:** the API token is wrong or
  lacks *Zone → DNS → Edit* for `torusmc.com`. Check
  `/etc/letsencrypt/cloudflare.ini`.
- **`ERR_TOO_MANY_REDIRECTS`:** Cloudflare SSL mode is `Flexible`. Set it to
  `Full (strict)` (step 1).
- **Cloudflare error 521 / 522:** Cloudflare can't reach the server. Check
  that Nginx is running and that ports 80/443 are open (step 2).
- **Cloudflare error 526:** the origin certificate is missing or invalid.
  Redo step 4 and reload Nginx.
- **`nginx -t` says the certificate file doesn't exist** — step 4 hasn't
  succeeded yet; enable the site (step 5) only after it has.
- **Build fails fetching fonts** — the build downloads the Geist font from
  Google Fonts, so the server needs outbound internet access during
  `docker compose … --build`.
