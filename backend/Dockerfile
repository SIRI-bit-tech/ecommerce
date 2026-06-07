FROM node:20-alpine

# Install openssl (required by Prisma) and bun globally
RUN apk add --no-cache openssl
RUN npm install -g bun

WORKDIR /app

# Copy package and lock files first for caching
COPY package.json bun.lock ./

# Install dependencies using bun
RUN bun install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Generate Prisma client using npx to ensure Node.js correctly detects the Alpine OpenSSL version
RUN npx prisma generate

# Compile TypeScript to JavaScript in the dist/ folder
RUN bun run build

# Set the environment variable for production
ENV NODE_ENV=production
ENV PORT=4000

# Expose the port the app runs on
EXPOSE 4000

# Start the Node.js process using the script defined in package.json
CMD ["npm", "run", "start"]
