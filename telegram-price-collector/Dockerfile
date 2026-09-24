FROM debian:bookworm-slim AS tdlib-build
ARG TDLIB_COMMIT=bc9c263e2bfee06aaab41e82db51a103376030bc
RUN apt-get update && apt-get install -y --no-install-recommends \
    ca-certificates git cmake g++ make gperf php-cli zlib1g-dev libssl-dev \
    && rm -rf /var/lib/apt/lists/*
RUN git clone https://github.com/tdlib/td.git /src/td \
    && git -C /src/td checkout "${TDLIB_COMMIT}" \
    && cmake -S /src/td -B /src/td/build -DCMAKE_BUILD_TYPE=Release \
    && cmake --build /src/td/build --target tdjson --parallel 2

FROM python:3.12-slim-bookworm
ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    LD_LIBRARY_PATH=/usr/local/lib
RUN apt-get update && apt-get install -y --no-install-recommends \
    libssl3 zlib1g tzdata \
    && rm -rf /var/lib/apt/lists/* \
    && useradd --system --uid 10001 --create-home collector \
    && mkdir -p /data \
    && chown collector:collector /data
COPY --from=tdlib-build /src/td/build/tdlib/libtdjson.so* /usr/local/lib/
RUN ldconfig
WORKDIR /app
COPY collector.py ./
USER collector
VOLUME ["/data"]
CMD ["python", "collector.py", "run"]
