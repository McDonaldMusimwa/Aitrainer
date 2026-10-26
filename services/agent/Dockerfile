FROM python:3.12-slim
ENV PYTHONDONTWRITEBYTECODE=1 PYTHONUNBUFFERED=1
WORKDIR /app
COPY requirements.txt .
# Optional build secret "extra_ca": a PEM root certificate pip should trust, for networks
# that inspect TLS. It is mounted only for this step and never stored in the image.
RUN --mount=type=secret,id=extra_ca,required=false \
    if [ -s /run/secrets/extra_ca ]; then \
        cat "$(python -c 'from pip._vendor import certifi; print(certifi.where())')" /run/secrets/extra_ca > /tmp/ca-bundle.pem \
        && export PIP_CERT=/tmp/ca-bundle.pem; \
    fi \
    && pip install --no-cache-dir -r requirements.txt \
    && rm -f /tmp/ca-bundle.pem \
    && useradd --create-home appuser
COPY . .
USER appuser
EXPOSE 8001
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8001"]
