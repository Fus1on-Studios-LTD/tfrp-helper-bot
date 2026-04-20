function success(res, data = {}, status = 200) {
  return res.status(status).json({
    ok: true,
    ...data,
  });
}

function failure(res, status, error, code = "REQUEST_FAILED", details = null) {
  return res.status(status).json({
    ok: false,
    error,
    code,
    details,
  });
}

module.exports = {
  success,
  failure,
};
