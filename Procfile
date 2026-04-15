web: cd backend && gunicorn server:app --worker-class uvicorn.workers.UvicornWorker --bind 0.0.0.0:${PORT:-10000} --timeout 120 --workers 1
