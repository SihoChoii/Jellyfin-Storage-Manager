# syntax=docker/dockerfile:1.7
##
## JellyMover backend production image
##

FROM rust:1.79 AS builder
# Edition 2024 requires the nightly toolchain today.
RUN rustup toolchain install nightly --profile minimal
WORKDIR /app

# Install dependencies and build the release binary.
COPY Cargo.toml Cargo.lock ./
COPY src ./src
RUN cargo +nightly build --release

FROM debian:bookworm-slim AS runtime
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/*

# Provide default locations for configuration and data.
RUN mkdir -p /config /data

COPY --from=builder /app/target/release/jellymover-backend /app/jellymover-backend

EXPOSE 3000
ENTRYPOINT ["/app/jellymover-backend"]

# Usage (run from the repository root):
#   docker build -t jellymover-backend ./backend
#   docker run --rm -p 3000:3000 -v $(pwd)/config:/config -v $(pwd)/data:/data jellymover-backend
