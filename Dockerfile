# Stage 1 : Build the application
FROM node:22-alpine AS build

# Set the working directory
WORKDIR /app

# Copy package.json and package-lock.json
COPY package*.json ./

# Install dependencies
# RUN npm install

# แนะนำใช้ 'npm ci' แทน 'npm install' ใน CI/CD เพื่อความแน่นอนของ version
RUN npm ci --lagacy-peer-deps

# Copy the rest of the application code
COPY . .

# Run Build
# ตรงนี้สำคัญ! มันจะสร้างโฟลเดอร์ dist/angular-conduit ขึ้นมา
RUN npm run build

# ให้มันลิสต์ชื่อไฟล์ออกมาดูหน่อยซิ ว่าสรุปแล้วแกชื่ออะไรกันแน่!
# RUN ls -R /app/dist 
# ----------------------

# Stage 2 : Serve the application with Nginx
FROM nginx:alpine

# Copy nginx configuration file(going to create this file in next step)
COPY nginx.conf /etc/nginx/conf.d/default.conf

# Copy ผลลัพธ์จากการ Build มาใส่ Nginx
# COPY --from=build /app/dist/angular-conduit /usr/share/nginx/html
# ถ้าเป็น angular version เก่าๆ จะใช้ตามด้านบน
# แต่ถ้าเป็น angular version ใหม่ๆ (เช่น version 14 ขึ้นไป)
# โฟลเดอร์ที่จะเอามาใส่ Nginx จะเปลี่ยยนเป็น dist/angular_conduit/browser

COPY --from=build /app/dist/angular-conduit/browser /usr/share/nginx/html

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

