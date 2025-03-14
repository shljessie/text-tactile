## AltCanvas

tone.js verison 14.7
pm2 start server/server.js --name text-tactile-backend

gcp instances
gcloud compute instances list


gcloud compute ssh altcanvas --zone=us-central1-a
pm2 logs text-tactile-backend

reverse proxy check 

sudo nano /etc/nginx/sites-available/default

sudo systemctl restart nginx


gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=http-server


server {
    listen 80;
    server_name altcanvas.art;

    location / {
        root /var/www/html;
        index index.html;
        try_files $uri /index.html;
    }

    location /api/ {  # Proxy API requests to Express backend
        proxy_pass http://localhost:3001/;  # Express server
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}

seongheelee@altcanvas:~/text-tactile$ sudo systemctl restart nginx
seongheelee@altcanvas:~/text-tactile$ sudo systemctl status nginx

sudo cp -r ~/text-tactile/build/* /var/www/html/
sudo systemctl restart nginx
pm2 restart text-tactile-backend
pm2 logs text-tactile-backend



 server {
    listen 80;
    server_name altcanvas.art;

     location / {
         root /var/www/html;
         index index.html;
         try_files $uri /index.html;
     }

     location /api/ {
         proxy_pass http://localhost:3001/;
         proxy_http_version 1.1;
         proxy_set_header Upgrade $http_upgrade;
         proxy_set_header Connection 'upgrade';
         proxy_set_header Host $host;
         proxy_cache_bypass $http_upgrade;
     }
 }






 NEW



 # 1. SSH into your GCP VM:
gcloud compute ssh altcanvas --zone=us-central1-a

# 2. Stop and remove any existing PM2 process:
pm2 stop text-tactile-backend
pm2 delete text-tactile-backend

# 3. Start your Node.js app with PM2:
pm2 start server/server.js --name text-tactile-backend

# 4. Check the PM2 logs:
pm2 logs text-tactile-backend

# 5. Edit the NGINX config file:
sudo nano /etc/nginx/sites-available/default
# Ensure it contains:
# server {
#     listen 80;
#     server_name altcanvas.art;
#
#     location / {
#         root /var/www/html;
#         index index.html;
#         try_files $uri /index.html;
#     }
#
#     location /api/ {
#         proxy_pass http://localhost:3001/;
#         proxy_http_version 1.1;
#         proxy_set_header Upgrade $http_upgrade;
#         proxy_set_header Connection 'upgrade';
#         proxy_set_header Host $host;
#         proxy_cache_bypass $http_upgrade;
#     }
# }

# 6. Restart NGINX to apply changes:
sudo systemctl restart nginx

# 7. (If not already set) Create a firewall rule to allow HTTP traffic:
gcloud compute firewall-rules create allow-http \
  --allow tcp:80 \
  --source-ranges=0.0.0.0/0 \
  --target-tags=http-server

# 8. Deploy your front-end files:
sudo cp -r ~/text-tactile/build/* /var/www/html/
sudo systemctl restart nginx

# 9. Optionally, restart the PM2 process:
pm2 restart text-tactile-backend

# 10. Verify everything with logs:
pm2 logs text-tactile-backend
