from fastapi import FastAPI, Depends, Request
import importlib
import multiprocessing
import base64
import os

# Cross-file imports
from sinks_1_to_5 import ChildExecutor, process_global_state, CustomError, schedule_task, execute_from_request_state
import config_globals
from sinks_6_to_10 import dangerous_generator, log_execution_decorator
from abyss_layer1 import layer1

app = FastAPI()

# ==========================================
# CROSS-FILE VULNERABILITIES (1-10)
# ==========================================

# Vuln 1: Deep OOP Inheritance
@app.get("/vuln1")
def vuln1(payload: str):
    executor = ChildExecutor()
    executor.run(payload)

# Vuln 2: Global State Mutation
@app.get("/vuln2")
def vuln2(payload: str):
    config_globals.unsafe_command = payload
    process_global_state()

# Vuln 3: Exception-Driven Execution
@app.get("/vuln3")
def vuln3(payload: str):
    try:
        raise CustomError(payload)
    except Exception as e:
        # We manually call the global handler here for simplicity in testing
        from sinks_1_to_5 import global_exception_handler
        global_exception_handler(e)

# Vuln 4: Higher-Order Function Callbacks
@app.get("/vuln4")
def vuln4(payload: str):
    # Passes a lambda returning the payload to a scheduler that evals it
    task = lambda: payload
    schedule_task(task)

# Vuln 5: Starlette Request State
# Middleware for Vuln 5
@app.middleware("http")
async def add_unsafe_state(request: Request, call_next):
    request.state.unsafe = request.headers.get("X-Unsafe")
    response = await call_next(request)
    return response

@app.get("/vuln5")
def vuln5(request: Request):
    execute_from_request_state(request)

# Vuln 6: Multiprocessing Map
@app.get("/vuln6")
def vuln6(payload: str):
    from sinks_6_to_10 import multiprocess_worker
    with multiprocessing.Pool(1) as p:
        p.map(multiprocess_worker, [payload])

# Vuln 7: Dynamic Imports
@app.get("/vuln7")
def vuln7(payload: str):
    sinks = importlib.import_module("sinks_6_to_10")
    sinks.run_dynamic(payload)

# Vuln 8: Generator send() (Yield From)
@app.get("/vuln8")
def vuln8(payload: str):
    gen = dangerous_generator()
    next(gen) # Prime the generator
    gen.send(payload)

# Vuln 9: Double Decorator Chain
def auth_decorator(func):
    def wrapper(request, *args, **kwargs):
        # Fake auth
        return func(request, *args, **kwargs)
    return wrapper

@app.get("/vuln9")
@auth_decorator
@log_execution_decorator
def vuln9(request: Request):
    return {"status": "ok"}

# Vuln 10: The 10-Layer Abyss
@app.get("/vuln10")
def vuln10(payload: str):
    layer1(payload)

# ==========================================
# INTRA-FILE VULNERABILITIES (11-20)
# ==========================================

class DBConn:
    def execute(self, q):
        os.system(q)

db_conn = DBConn()

# Vuln 11: Dynamic getattr Routing
@app.get("/vuln11")
def vuln11(request: Request):
    method_name = request.query_params.get("method", "safe_method")
    payload = request.query_params.get("payload")
    if hasattr(db_conn, method_name):
        getattr(db_conn, method_name)(payload)

# Vuln 12: List Unpacking/Zip
@app.get("/vuln12")
def vuln12(payload: str):
    keys = ['safe', 'cmd']
    vals = ['1', payload]
    d = dict(zip(keys, vals))
    os.system(d['cmd'])

# Vuln 13: Pydantic Model Dump
from pydantic import BaseModel
class UserModel(BaseModel):
    query: str

@app.post("/vuln13")
def vuln13(user: UserModel):
    data = user.model_dump()
    os.system(data['query'])

# Vuln 14: Metaclass Magic
class MetaExecute(type):
    def __new__(cls, name, bases, dct):
        dct['execute'] = lambda self, cmd: os.system(cmd)
        return super().__new__(cls, name, bases, dct)

class DynamicModel(metaclass=MetaExecute):
    pass

@app.get("/vuln14")
def vuln14(payload: str):
    DynamicModel().execute(payload)

# Vuln 15: Recursive Taint
def recursive_executor(cmd, depth):
    if depth == 0:
        os.system(cmd)
    else:
        recursive_executor(cmd, depth - 1)

@app.get("/vuln15")
def vuln15(payload: str):
    recursive_executor(payload, 5)

# Vuln 16: Context Manager
class UnsafeContext:
    def __init__(self, val):
        self.val = val
    def __enter__(self):
        return self
    def __exit__(self, exc_type, exc_val, exc_tb):
        pass

@app.get("/vuln16")
def vuln16(payload: str):
    with UnsafeContext(payload) as ctx:
        os.system(ctx.val)

# Vuln 17: Dictionary setdefault Trap
@app.get("/vuln17")
def vuln17(payload: str):
    d = {}
    d.setdefault('cmd', payload)
    os.system(d['cmd'])

# Vuln 18: Format String Injection
@app.get("/vuln18")
def vuln18(payload: str):
    query = "SELECT * FROM {tbl}".format(tbl=payload)
    # The vulnerability is actually the query itself acting as a shell command for simplicity
    os.system(query)

# Vuln 19: Base64 Decode Bypass
@app.get("/vuln19")
def vuln19(payload: str):
    # payload is base64 encoded by attacker
    decoded = base64.b64decode(payload)
    eval(decoded)

# Vuln 20: FastAPI Dependency Generator
def unsafe_dependency(request: Request):
    yield request.headers.get("X-Command")

@app.get("/vuln20")
def vuln20(cmd: str = Depends(unsafe_dependency)):
    if cmd:
        os.system(cmd)
