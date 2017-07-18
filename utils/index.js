export const errorBuilder = ({ at, err }) => ({
  at, err,
  errMessage: typeof err === 'object' && err.message || undefined
})