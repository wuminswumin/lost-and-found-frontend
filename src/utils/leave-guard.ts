type LeaveGuard = () => Promise<boolean>

let currentLeaveGuard: LeaveGuard | null = null

export function setLeaveGuard(guard: LeaveGuard) {
  currentLeaveGuard = guard
}

export function clearLeaveGuard(guard: LeaveGuard) {
  if (currentLeaveGuard === guard) {
    currentLeaveGuard = null
  }
}

export async function confirmCurrentLeave() {
  if (!currentLeaveGuard) {
    return true
  }

  return await currentLeaveGuard()
}