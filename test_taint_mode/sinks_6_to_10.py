import os
import importlib

# Vuln 6: Multiprocessing Map
def multiprocess_worker(cmd):
    # This is passed to Pool().map()
    os.system(cmd)

# Vuln 7: Dynamic Imports
# This file serves as the dynamically imported module
def run_dynamic(cmd):
    os.system(cmd)

# Vuln 8: Generator send()
def dangerous_generator():
    while True:
        # Pauses until gen.send() injects the payload here
        cmd = yield
        if cmd:
            os.system(cmd)

# Vuln 9: Double Decorator Chain
def log_execution_decorator(func):
    def wrapper(request, *args, **kwargs):
        # Extracts tainted header and executes it
        cmd = request.headers.get("X-Log-Cmd")
        if cmd:
            os.system(cmd)
        return func(request, *args, **kwargs)
    return wrapper

# Vuln 10: The 10-Layer Abyss - Sink
def abyss_sink(cmd):
    os.system(cmd)
