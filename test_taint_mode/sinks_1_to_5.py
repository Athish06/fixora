import os
import subprocess
import config_globals

# Vuln 1: Deep OOP Inheritance
class BaseExecutor:
    def _execute(self, payload):
        os.system(payload)

class ChildExecutor(BaseExecutor):
    def run(self, data):
        self._execute(data)

# Vuln 2: Global State Mutation
def process_global_state():
    # Reads from the global state set in main.py
    if hasattr(config_globals, 'unsafe_command'):
        os.system(config_globals.unsafe_command)

# Vuln 3: Exception-Driven Execution
class CustomError(Exception):
    def __init__(self, payload):
        self.payload = payload
        super().__init__(self.payload)

def global_exception_handler(exc: Exception):
    if isinstance(exc, CustomError):
        # AI should flag this if it sees it, but the chain is purely exception-based
        subprocess.Popen(f"echo {exc.payload}", shell=True)

# Vuln 4: Higher-Order Function Callbacks
def schedule_task(task_func):
    # Executes whatever function is passed to it
    res = task_func()
    # The result of the lambda is passed to eval
    eval(res)

# Vuln 5: Starlette Request State
def execute_from_request_state(request):
    # Extracts the tainted state
    unsafe_val = request.state.unsafe
    os.system(unsafe_val)
