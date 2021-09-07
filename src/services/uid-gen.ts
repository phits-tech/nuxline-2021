// TODO: Fix Lint errors
/* eslint-disable unicorn/prefer-math-trunc */
/* eslint-disable sonar/arrow-function-convention */
/* eslint-disable @typescript-eslint/explicit-function-return-type */
export const uuidv4 = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = Math.random() * 16 | 0
    const v = c === 'x' ? r : (r & 0x3 | 0x8)
    return v.toString(16)
  })
}

export default uuidv4
