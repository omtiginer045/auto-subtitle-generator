# Temel Node.js imajı
FROM node:20-slim

WORKDIR /app

# Bağımlılıkları kur
COPY package*.json ./
RUN npm install

# Kodları kopyala
COPY . .

EXPOSE 5173

# Vite sunucusunu dış ağa açarak başlat
CMD ["npm", "run", "dev", "--", "--host"]