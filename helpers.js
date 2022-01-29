const findUserByEmail = (email, database) => {
  for (let user_id in database) {
    const user = database[user_id]
    if (user.email === email)
    return user
  }
  return null
}

module.exports = { findUserByEmail }