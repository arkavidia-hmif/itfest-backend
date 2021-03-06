FROM node:14

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci

# Copy code
COPY . .

ENV NODE_ENV=production

# Run
EXPOSE 3000
CMD [ "/usr/src/app/start.sh" ]

