FROM node:20-alpine
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Vite build scaffold comes in Step 11.
EXPOSE 5173
CMD ["npm", "run", "dev"]
