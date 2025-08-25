import multiprocessing

bind = "0.0.0.0:" + str(8000)
workers = (multiprocessing.cpu_count() * 2) + 1
worker_class = "uvicorn.workers.UvicornWorker"
graceful_timeout = 30
timeout = 60
keepalive = 5
accesslog = "-"
errorlog = "-"
