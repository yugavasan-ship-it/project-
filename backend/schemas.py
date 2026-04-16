from pydantic import BaseModel
from typing import List, Optional

class UserCreate(BaseModel):
    username: str
    password: str
    role: str

class UserLogin(BaseModel):
    username: str
    password: str

class LeaveApply(BaseModel):
    employee_name: str
    date: str

class ScheduleUpdate(BaseModel):
    date: str
    shift_id: int
    old_employee_id: int
    new_employee_id: int
