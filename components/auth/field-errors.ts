type FieldErrorItem = {
  message: string
}

function toFieldErrors(errors: ReadonlyArray<unknown>): FieldErrorItem[] {
  return errors.flatMap((error) => {
    if (typeof error === "string") {
      return [{ message: error }]
    }

    if (
      typeof error === "object" &&
      error !== null &&
      "message" in error &&
      typeof error.message === "string"
    ) {
      return [{ message: error.message }]
    }

    return []
  })
}

export { toFieldErrors }
