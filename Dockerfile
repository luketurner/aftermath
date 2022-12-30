FROM node:18

# All of these dependencies are required for Puppeteer, which is used by mermaid-cli
RUN apt-get update && apt-get install -y \
  libnss3 \
  libnspr4 \
  libatk1.0-0 \
  libatk-bridge2.0-0 \
  libcups2 \
  libdrm2 \
  libdbus-1-3 \
  libxkbcommon0 \
  libgbm1 \
  libxcomposite1 \
  libxdamage1 \
  libxfixes3 \
  libxrandr2 \
  libasound2 && \
  rm -rf /var/lib/apt/lists/*

WORKDIR /tmp/d2
RUN wget https://github.com/terrastruct/d2/releases/download/v0.1.3/d2-v0.1.3-linux-amd64.tar.gz -O d2.tar.gz --quiet && \
  tar -xf d2.tar.gz && \
  cp d2-v0.1.3/bin/d2 . && \
  rm -r d2.tar.gz d2-v0.1.3 && \
  chmod +x d2 && \
  mv d2 /usr/local/bin/d2

# Puppeteer can't be run as root, so we create a user for aftermath
RUN useradd -rm aftermath -G audio,video
RUN chown -R aftermath:aftermath /home/aftermath

WORKDIR /home/aftermath
USER aftermath

COPY --chown=aftermath:aftermath package.json package.json
COPY --chown=aftermath:aftermath package-lock.json package-lock.json

RUN npm ci

COPY --chown=aftermath:aftermath ./ ./

RUN mkdir input

CMD npm run start -- input