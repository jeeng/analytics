import Hashids from 'hashids'

const salt = 'This is salt for hashIds bkahbkahbkah123!@#'
const hashIds = new Hashids(salt, 10)

export const errorBuilder = ({ at, err }) => ({
  at, err,
  errMessage: typeof err === 'object' && err.message || undefined
})

export const encodeId = id => {
  const parsedId = parseInt(id)
  return isNaN(parsedId) ? null : hashIds.encode(parsedId)
}

export const decodeId = hashid => {
  try {
    const idArr = hashIds.decode(hashid)
    return !!idArr.length && idArr[0] || []
  } catch (e) {
    return undefined
  }
}