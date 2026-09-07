(function (root) {
  'use strict';
  function buildPostBody(action, payload) {
    var body = new URLSearchParams();
    body.set('action', String(action || 'assessment'));
    body.set('payload', JSON.stringify(payload || {}));
    return body;
  }
  function buildJsonpUrl(apiUrl, action, token) {
    var url = new URL(apiUrl);
    url.searchParams.set('action', action);
    if (token) url.searchParams.set('token', token);
    url.searchParams.set('callback', 'UPMAS.receiveJsonp');
    url.searchParams.set('_', String(Date.now()));
    return url.toString();
  }
  function parseReceipt(data, expectedToken) {
    if (!data || data.token !== expectedToken) throw new Error('ไม่สามารถยืนยันรายการส่งข้อมูลได้');
    if (!data.ok || !data.saved) throw new Error('ยังไม่พบข้อมูลที่บันทึก');
    return data;
  }
  var api = { buildPostBody: buildPostBody, buildJsonpUrl: buildJsonpUrl, parseReceipt: parseReceipt };
  root.UPMASTransport = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof globalThis !== 'undefined' ? globalThis : this);
