import pandas as pd
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import Employee, Shift, Schedule, Leave
from datetime import date, timedelta
import random

# ─── Column name aliases (extremely permissive) ─────────────────────────────
COL_EMP_ID     = ['employee id', 'emp id', 'id', 'empid', 'staff id', 'eid', 'code', 'employee #', 'employee_id']
COL_NAME       = ['name', 'employee name', 'full name', 'emp name', 'staff name', 'person', 'fullname']
COL_SKILLS     = ['skills', 'qualifications', 'skillset', 'ability', 'roles', 'skill', 'dept']
COL_PREF_SHIFT = ['preferred shift', 'preference', 'shift preference', 'preferred', 'preferred_shift', 'choice']
COL_MAX_HOURS  = ['max hours', 'hours limit', 'hours', 'max hrs', 'max_hours', 'limit']
COL_SHIFT_NAME = ['shift name', 'shift', 'shift_name', 'typename', 'slot']
COL_START_TIME = ['start time', 'start', 'start_time', 'from', 'begins', 'opening']
COL_END_TIME   = ['end time', 'end', 'end_time', 'to', 'ends', 'closing']


def _get(row: dict, keys: list):
    """Case-insensitive column lookup."""
    for k in row:
        if k.lower().strip() in keys:
            return row[k]
    return None


def parse_combined_excel(file_path: str, db: Session) -> str:
    """
    Parses Excel with employee columns + optional shift timing columns.
    - Upserts employees by emp_id
    - If Shift Name + Start Time + End Time columns exist, updates OR creates
      that shift's timing in DB.
    - Returns a summary string.
    """
    df = pd.read_excel(file_path, dtype=str)
    df = df.where(pd.notna(df), None)

    inserted = 0
    updated  = 0
    skipped  = 0
    processed_shift_names = set()

    for idx, row in df.iterrows():
        try:
            row_dict = row.to_dict()

            # ── Employee data (LOOSE VALIDATION) ──────────────────────────────
            emp_id = _get(row_dict, COL_EMP_ID)
            name   = _get(row_dict, COL_NAME)

            # Accept if we have either ID or Name
            if emp_id or name:
                emp_id = str(emp_id if emp_id else f"EMP-{idx+1}").strip()
                name   = str(name if name else f"Employee {emp_id}").strip()

                raw_skills = _get(row_dict, COL_SKILLS)
                pref_shift = _get(row_dict, COL_PREF_SHIFT)
                max_hrs    = _get(row_dict, COL_MAX_HOURS)

                skills     = [s.strip() for s in str(raw_skills).split(',')] if raw_skills else []
                
                try:
                    max_hrs = int(float(str(max_hrs).strip())) if max_hrs else 40
                except (ValueError, TypeError):
                    max_hrs = 40
                
                pref_shift = str(pref_shift).strip() if pref_shift else 'Morning'

                existing = db.query(Employee).filter(Employee.emp_id == emp_id).first()
                if existing:
                    existing.name            = name
                    existing.skills          = skills
                    existing.preferred_shift = pref_shift
                    existing.max_hours       = max_hrs
                    updated += 1
                else:
                    db.add(Employee(
                        emp_id=emp_id, name=name, skills=skills,
                        preferred_shift=pref_shift, max_hours=max_hrs,
                    ))
                    inserted += 1
            else:
                # If row is totally empty or unidentifiable, we only skip if literally no data exists
                if any(v for v in row_dict.values() if v is not None):
                    # Try to use whatever is in the first column as a name
                    fallback_val = list(row_dict.values())[0]
                    if fallback_val:
                        emp_id = f"ROW-{idx+1}"
                        name   = str(fallback_val)
                        db.add(Employee(emp_id=emp_id, name=name, skills=[], preferred_shift='Morning', max_hours=40))
                        inserted += 1
                    else:
                        skipped += 1
                else:
                    skipped += 1

            # ── Shift timing (LOOSE VALIDATION) ───────────────────────────
            shift_name = _get(row_dict, COL_SHIFT_NAME)
            start_time = _get(row_dict, COL_START_TIME)
            end_time   = _get(row_dict, COL_END_TIME)

            if shift_name and shift_name not in processed_shift_names:
                shift_name = str(shift_name).strip()
                # Use defaults if times are missing
                start_time = str(start_time).strip() if start_time else "09:00"
                end_time   = str(end_time).strip() if end_time else "17:00"
                
                existing_s = db.query(Shift).filter(Shift.name == shift_name).first()
                if existing_s:
                    existing_s.start_time = start_time
                    existing_s.end_time   = end_time
                else:
                    db.add(Shift(
                        name=shift_name, 
                        start_time=start_time, 
                        end_time=end_time,
                        required_employees=2
                    ))
                processed_shift_names.add(shift_name)
        except Exception as e:
            print(f"[Parser] Error processing row {idx}: {e}")
            skipped += 1

    db.commit()
    return f"{inserted} new, {updated} updated, {skipped} skipped"

def parse_employees_excel(file_path: str, db: Session):
    """Wrapper for main.py compatibility."""
    return parse_combined_excel(file_path, db)

def parse_shifts_excel(file_path: str, db: Session):
    """Wrapper for main.py compatibility."""
    return parse_combined_excel(file_path, db)

def clear_all_operational_data(db: Session):
    """Deletes all existing operational data from the database."""
    try:
        db.query(Schedule).delete()
        db.query(Leave).delete()
        db.query(Employee).delete()
        db.query(Shift).delete()
        db.commit()
        print("[DB] Cleared all operational data (Employees, Shifts, Schedules, Leaves).")
    except Exception as e:
        db.rollback()
        print(f"[DB] Error clearing data: {e}")

def ensure_default_shifts(db: Session):
    """Ensures at least the 4 standard shifts exist if none are provided in Excel."""
    count = db.query(Shift).count()
    if count == 0:
        defaults = [
            ("Morning", "06:00", "12:00"),
            ("Afternoon", "12:00", "18:00"),
            ("Evening", "18:00", "00:00"),
            ("Night", "00:00", "06:00")
        ]
        for name, start, end in defaults:
            db.add(Shift(name=name, start_time=start, end_time=end, required_employees=2))
        db.commit()
        print("[DB] No shifts found. Seeded 4 default shifts.")


def _shift_hours(start: str, end: str) -> int:
    """Calculate shift duration in hours, handling midnight crossover."""
    try:
        sh, sm = map(int, start.split(':'))
        eh, em = map(int, end.split(':'))
        start_mins = sh * 60 + sm
        end_mins   = eh * 60 + em
        if end_mins <= start_mins:      # crosses midnight
            end_mins += 24 * 60
        return max(1, (end_mins - start_mins) // 60)
    except Exception:
        return 6


def _get_historical_hours(db: Session, emp_ids: list, days: int = 7) -> dict:
    """
    Returns dict of {employee_id: total_hours_last_N_days}
    based on past schedules stored in the database.
    """
    cutoff = (date.today() - timedelta(days=days)).isoformat()
    past = (
        db.query(Schedule.employee_id, Shift.name, Shift.start_time, Shift.end_time)
        .join(Shift, Schedule.shift_id == Shift.id)
        .filter(Schedule.date >= cutoff)
        .filter(Schedule.date < date.today().isoformat())
        .all()
    )
    hours = {eid: 0 for eid in emp_ids}
    for emp_id, _, start, end in past:
        if emp_id in hours:
            hours[emp_id] += _shift_hours(start, end)
    return hours


def _get_recent_shift_assignments(db: Session, emp_ids: list, days: int = 2) -> dict:
    """
    Returns {employee_id: [shift_name, ...]} for the last N days.
    Used to avoid consecutive same-shift assignment (e.g., 3 nights in a row).
    """
    cutoff = (date.today() - timedelta(days=days)).isoformat()
    past = (
        db.query(Schedule.employee_id, Shift.name)
        .join(Shift, Schedule.shift_id == Shift.id)
        .filter(Schedule.date >= cutoff)
        .filter(Schedule.date < date.today().isoformat())
        .all()
    )
    history = {eid: [] for eid in emp_ids}
    for emp_id, shift_name in past:
        if emp_id in history:
            history[emp_id].append(shift_name)
    return history


def generate_ai_schedule(db: Session, target_date: str = None):
    """
    AI Scheduling Engine — Enhanced 3-phase approach with leave and day-off management:

    Phase 1: Preference-first assignment (respects preferred_shift).
    Phase 2: Fill required slots with balanced candidates.
    Phase 3: Assign remaining employees while ensuring day-off requirements.

    Enhanced features:
    - Respects leave requests for the target date
    - Ensures employees get at least one day off per week
    - Prioritizes night shift assignments to employees with Night preference
    - Automatic reassignment when leave is uploaded
    """
    if not target_date:
        target_date = date.today().isoformat()

    employees = db.query(Employee).all()
    shifts    = db.query(Shift).all()
    leaves    = db.query(Leave).filter(Leave.date == target_date).all()
    leave_ids = {l.employee_id for l in leaves}

    # Clear today's existing schedule
    db.query(Schedule).filter(Schedule.date == target_date).delete()
    db.flush()

    available = [e for e in employees if e.id not in leave_ids]
    if not available or not shifts:
        db.commit()
        print("[AI] No employees or shifts — skipping.")
        return

    emp_ids      = [e.id for e in available]
    shift_dur    = {s.id: _shift_hours(s.start_time, s.end_time) for s in shifts}

    # ── Historical context ─────────────────────────────────────────────────────
    hist_hours   = _get_historical_hours(db, emp_ids, days=7)
    recent_shifts = _get_recent_shift_assignments(db, emp_ids, days=2)
    
    # Get days worked this week for each employee
    week_start = (date.today() - timedelta(days=date.today().weekday())).isoformat()
    days_worked = {}
    for emp in employees:
        schedules = db.query(Schedule).filter(
            Schedule.employee_id == emp.id,
            Schedule.date >= week_start,
            Schedule.date < target_date
        ).all()
        days_worked[emp.id] = len(set(s.date for s in schedules))

    shift_assignments = {s.id: [] for s in shifts}
    employee_hours    = {e.id: 0 for e in available}
    assigned_emps     = set()

    def priority_score(emp, shift):
        """
        Lower score = higher priority for this shift.
        Considers: weekly hours, preference match, recent consecutive shifts, day-off requirement.
        """
        score = hist_hours.get(emp.id, 0)           # fewer past hours = lower score = picked first
        if emp.preferred_shift != shift.name:
            score += 100                             # penalty for non-preferred
        
        # Night shift priority: employees with Night preference get bonus for Night shifts
        if shift.name == 'Night' and emp.preferred_shift == 'Night':
            score -= 50                              # bonus for Night preference on Night shift
        
        recent = recent_shifts.get(emp.id, [])
        if recent.count(shift.name) >= 2:
            score += 200                             # strong penalty for 3+ consecutive same shift
        
        # Day-off consideration: employees who have worked 6+ days this week get penalty
        if days_worked.get(emp.id, 0) >= 6:
            score += 150                             # penalty if already worked 6+ days
        
        return score

    # ── Phase 1: Preferred shifts ──────────────────────────────────────────────
    for shift in shifts:
        preferred = [
            e for e in available
            if e.preferred_shift == shift.name and e.id not in assigned_emps
        ]
        preferred.sort(key=lambda e: priority_score(e, shift))

        for emp in preferred:
            if len(shift_assignments[shift.id]) >= shift.required_employees:
                break
            dur = shift_dur[shift.id]
            if employee_hours[emp.id] + dur <= emp.max_hours:
                shift_assignments[shift.id].append(emp.id)
                employee_hours[emp.id] += dur
                assigned_emps.add(emp.id)

    # ── Phase 2: Fill required slots ───────────────────────────────────────────
    for shift in shifts:
        while len(shift_assignments[shift.id]) < shift.required_employees:
            candidates = [e for e in available if e.id not in assigned_emps]
            if not candidates:
                break
            candidates.sort(key=lambda e: priority_score(e, shift))
            dur = shift_dur[shift.id]
            valid = [c for c in candidates if employee_hours[c.id] + dur <= c.max_hours]
            chosen = (valid or candidates)[0]
            shift_assignments[shift.id].append(chosen.id)
            employee_hours[chosen.id] += dur
            assigned_emps.add(chosen.id)

    # ── Phase 3: Assign remaining employees with day-off consideration ─────────────
    for emp in available:
        if emp.id not in assigned_emps:
            # Check if employee has already worked 6+ days this week
            if days_worked.get(emp.id, 0) >= 6:
                # Give them a day off - don't assign
                print(f"[AI] Employee {emp.name} gets day off (worked {days_worked[emp.id]} days this week)")
                continue
            
            # Assign to the least-loaded shift (balance)
            target = min(shifts, key=lambda s: len(shift_assignments[s.id]))
            shift_assignments[target.id].append(emp.id)
            employee_hours[emp.id] += shift_dur[target.id]
            assigned_emps.add(emp.id)

    # ── Persist to DB ──────────────────────────────────────────────────────────
    for shift_id, emp_ids_list in shift_assignments.items():
        for emp_id in emp_ids_list:
            db.add(Schedule(date=target_date, shift_id=shift_id, employee_id=emp_id))

    db.commit()
    _log_schedule(shift_assignments, shifts, available, hist_hours)


def _log_schedule(assignments, shifts, employees, hist_hours):
    id_to_name  = {e.id: f"{e.name} ({e.emp_id})" for e in employees}
    id_to_shift = {s.id: s.name for s in shifts}
    total = sum(len(v) for v in assignments.values())
    print(f"\n[AI Scheduler] Schedule generated — {total} assignments:")
    for sid, eids in assignments.items():
        names = [id_to_name.get(eid, str(eid)) for eid in eids]
        print(f"  {id_to_shift.get(sid, sid)}: {', '.join(names) or 'EMPTY'}")
    print(f"  Weekly hours context used: {len(hist_hours)} employees")


def reassign_shift(db: Session, employee_id: int, leave_date: str):
    """
    Reassign an employee's shift when they apply for leave with automatic AI scheduling.
    Handles weekly off vs leave conflict: if leave requested on weekly off day, swap assignments.
    """
    schedules = db.query(Schedule).filter(
        Schedule.employee_id == employee_id,
        Schedule.date == leave_date
    ).all()

    # Check if requesting employee has weekly off on this day (not scheduled)
    if not schedules:
        # Employee requesting leave is not scheduled - they might have weekly off
        # Find who is scheduled on this day and check if they should take weekly off instead
        day_schedules = db.query(Schedule).filter(Schedule.date == leave_date).all()
        
        if day_schedules:
            # Check if any scheduled employee has worked 6+ days this week
            week_start = (date.today() - timedelta(days=date.today().weekday())).isoformat()
            for sched in day_schedules:
                emp_schedules = db.query(Schedule).filter(
                    Schedule.employee_id == sched.employee_id,
                    Schedule.date >= week_start,
                    Schedule.date < leave_date
                ).all()
                days_worked = len(set(s.date for s in emp_schedules))
                
                # If scheduled employee has worked 6+ days, give them weekly off
                if days_worked >= 6:
                    emp = db.query(Employee).filter(Employee.id == sched.employee_id).first()
                    # Assign leave requester to this shift instead
                    db.add(Schedule(date=leave_date, shift_id=sched.shift_id, employee_id=employee_id))
                    db.delete(sched)
                    db.flush()
                    print(f"[AI] Weekly off swap: {emp.name} gets day off, leave requester works instead")
                    db.commit()
                    return

    for sched in schedules:
        shift_id = sched.shift_id
        db.delete(sched)
        db.flush()

        shift     = db.query(Shift).filter(Shift.id == shift_id).first()
        all_emps  = db.query(Employee).all()
        leave_ids = {
            l.employee_id for l in db.query(Leave).filter(Leave.date == leave_date).all()
        }
        leave_ids.add(employee_id)

        busy_ids = {
            s.employee_id
            for s in db.query(Schedule).filter(Schedule.date == leave_date).all()
        }

        emp_ids     = [e.id for e in all_emps]
        hist_hours  = _get_historical_hours(db, emp_ids, days=7)
        candidates  = [
            e for e in all_emps
            if e.id not in leave_ids and e.id not in busy_ids
        ]

        if candidates:
            # Prioritize employees with Night preference for Night shifts
            if shift.name == 'Night':
                preferred = [c for c in candidates if c.preferred_shift == 'Night']
                pool = preferred or candidates
            else:
                preferred = [c for c in candidates if c.preferred_shift == shift.name]
                pool = preferred or candidates
            
            pool.sort(key=lambda e: hist_hours.get(e.id, 0))  # least hours first
            if pool:
                replacement = pool[0]
                db.add(Schedule(date=leave_date, shift_id=shift_id, employee_id=replacement.id))
                print(f"[AI] Reassigned {shift.name} shift to {replacement.name} (preferred: {replacement.preferred_shift})")

    db.commit()


def handle_leave_request(db: Session, employee_id: int, leave_date: str):
    """
    Handle leave request with weekly off consideration:
    - If employee requesting leave is scheduled, reassign their shift
    - If employee requesting leave has weekly off (not scheduled), check if scheduled employees need weekly off
    - Swap assignments if scheduled employee has worked 6+ days
    """
    # Check if requesting employee is scheduled on leave date
    schedules = db.query(Schedule).filter(
        Schedule.employee_id == employee_id,
        Schedule.date == leave_date
    ).all()
    
    if schedules:
        # Employee is scheduled - reassign their shift
        reassign_shift(db, employee_id, leave_date)
    else:
        # Employee has weekly off (not scheduled) - check if we should swap
        week_start = (date.today() - timedelta(days=date.today().weekday())).isoformat()
        day_schedules = db.query(Schedule).filter(Schedule.date == leave_date).all()
        
        for sched in day_schedules:
            emp_schedules = db.query(Schedule).filter(
                Schedule.employee_id == sched.employee_id,
                Schedule.date >= week_start,
                Schedule.date < leave_date
            ).all()
            days_worked = len(set(s.date for s in emp_schedules))
            
            # If scheduled employee has worked 6+ days, give them weekly off
            if days_worked >= 6:
                emp = db.query(Employee).filter(Employee.id == sched.employee_id).first()
                requester = db.query(Employee).filter(Employee.id == employee_id).first()
                
                # Swap: requester works, scheduled employee gets weekly off
                db.add(Schedule(date=leave_date, shift_id=sched.shift_id, employee_id=employee_id))
                db.delete(sched)
                db.flush()
                print(f"[AI] Weekly off swap: {emp.name} gets day off (worked {days_worked} days), {requester.name} works instead")
                db.commit()
                break
