(function () {
  'use strict';
  var config = window.UPMAS_CONFIG;
  var transport = window.UPMASTransport;
  var ux = window.UPMASUX;
  var pendingJsonp = null;
  var state = {
    bootstrap: null,
    questionIndex: 0,
    answers: {},
    caseId: '',
    assessment: null,
    submissionToken: '',
    partC: { emergencyNow:'', previousSevereReaction:'', reactionTrigger:'', epinephrineStatus:'', hasEmergencyPlan:'', foodAccessStatus:'' }
  };

  var el = {};
  [
    'landingScreen','pdpaScreen','profileScreen','questionScreen','safetyFollowup','processingScreen','resultScreen','contactScreen','doneScreen',
    'pdpaConsent','pdpaContinue','pdpaCancel','pdpaError','privacyLink','startButton','landingError','ageBand','province','district','website','profileError','profileBack','profileNext',
    'questionSectionLabel','questionProgress','questionProgressBadge','progressBar','questionCard','questionBack','questionNext','reactionTrigger','epinephrineStatus','severeHistoryFields','foodAccessFields','safetyEmergencyNotice','safetyError','safetyBack','safetySubmit','systemModeBanner',
    'riskGauge','riskNumber','riskTitle','resultDisclaimer','certaintyText','safetyResult','reasonList','caringText','specialistLink','printResultButton','savePdfButton','printHint',
    'requestContactButton','finishButton','parentName','contactPhone','preferredContactTime','contactConsent','contactError','contactBack','contactSubmit',
    'doneTitle','doneMessage','donePrivacyLink','globalError'
  ].forEach(function (id) { el[id] = document.getElementById(id); });

  window.UPMAS = {
    receiveJsonp: function (data) {
      if (!pendingJsonp) return;
      var p = pendingJsonp; pendingJsonp = null;
      clearTimeout(p.timer); if (p.script && p.script.remove) p.script.remove();
      p.resolve(data);
    }
  };

  function showOnly(id) {
    ['landingScreen','pdpaScreen','profileScreen','questionScreen','safetyFollowup','processingScreen','resultScreen','contactScreen','doneScreen'].forEach(function (key) {
      el[key].classList.toggle('hidden', key !== id);
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  function setError(node, message) {
    node.textContent = message || '';
    node.classList.toggle('hidden', !message);
  }

  function loadJsonp(action, token) {
    if (pendingJsonp) return Promise.reject(new Error('มีคำขอที่กำลังดำเนินการ'));
    return new Promise(function (resolve, reject) {
      var script = document.createElement('script');
      script.src = transport.buildJsonpUrl(config.API_URL, action, token);
      script.async = true;
      var timer = setTimeout(function () { cleanup(); reject(new Error('ระบบตอบกลับช้าเกินกำหนด')); }, config.REQUEST_TIMEOUT_MS);
      function cleanup() { clearTimeout(timer); if (script.remove) script.remove(); pendingJsonp = null; }
      script.onerror = function () { cleanup(); reject(new Error('ไม่สามารถเชื่อมต่อระบบบันทึกข้อมูล')); };
      pendingJsonp = { resolve: resolve, reject: reject, timer: timer, script: script };
      document.head.appendChild(script);
    });
  }

  function wait(ms) { return new Promise(function (resolve) { setTimeout(resolve, ms); }); }
  async function pollReceipt(action, token) {
    var last;
    for (var i = 0; i < config.POLL_ATTEMPTS; i++) {
      await wait(i < 4 ? 400 + i * 300 : 1500);
      try { return transport.parseReceipt(await loadJsonp(action, token), token); } catch (error) { last = error; }
    }
    throw last || new Error('ไม่สามารถยืนยันการบันทึกได้');
  }

  function makeUuid() {
    if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = Math.random() * 16 | 0; return (c === 'x' ? r : (r & 3 | 8)).toString(16);
    });
  }

  function selectedRadio(name) {
    var node = document.querySelector('input[name="' + name + '"]:checked');
    return node ? node.value : '';
  }

  function renderQuestion() {
    var q = ux.QUESTIONS[state.questionIndex];
    el.questionSectionLabel.textContent = ux.questionSectionLabel(state.questionIndex);
    el.questionProgress.textContent = 'คำถาม ' + (state.questionIndex + 1) + ' จาก ' + ux.QUESTIONS.length;
    el.questionProgressBadge.textContent = (state.questionIndex + 1) + '/' + ux.QUESTIONS.length;
    el.progressBar.style.width = Math.round(((state.questionIndex + 1) / ux.QUESTIONS.length) * 100) + '%';
    el.questionCard.textContent = '';
    var number = document.createElement('div'); number.className = 'question-number'; number.textContent = 'คำถาม ' + (state.questionIndex + 1);
    var title = document.createElement('h2'); title.textContent = q.title;
    var help = document.createElement('p'); help.className = 'question-help'; help.textContent = q.help;
    var list = document.createElement('div'); list.className = 'choice-list';
    q.options.forEach(function (option) {
      var button = document.createElement('button'); button.type = 'button'; button.className = 'choice mockup-option'; button.textContent = option.label;
      if (state.answers[q.key] === option.value) button.classList.add('selected');
      button.addEventListener('click', function () {
        state.answers[q.key] = option.value;
        Array.prototype.forEach.call(list.querySelectorAll('.choice'), function (node) { node.classList.remove('selected'); node.setAttribute('aria-pressed','false'); });
        button.classList.add('selected'); button.setAttribute('aria-pressed','true');
        el.questionNext.disabled = false;
      });
      button.setAttribute('aria-pressed', state.answers[q.key] === option.value ? 'true' : 'false');
      list.appendChild(button);
    });
    el.questionCard.appendChild(number); el.questionCard.appendChild(title); el.questionCard.appendChild(help); el.questionCard.appendChild(list);
    el.questionBack.disabled = state.questionIndex === 0;
    el.questionNext.disabled = !state.answers[q.key];
    el.questionNext.textContent = state.questionIndex === ux.QUESTIONS.length - 1 ? 'ไปส่วนความปลอดภัย ›' : 'ถัดไป ›';
  }

  function bucket(width) { return ux.bucketWidth(width); }

  function detectBrowser(ua) {
    var match;
    if ((match = ua.match(/Edg\/(\d+)/))) return { family: 'Edge', major: match[1] };
    if ((match = ua.match(/CriOS\/(\d+)/))) return { family: 'Chrome', major: match[1] };
    if ((match = ua.match(/Chrome\/(\d+)/))) return { family: 'Chrome', major: match[1] };
    if ((match = ua.match(/FxiOS\/(\d+)/))) return { family: 'Firefox', major: match[1] };
    if ((match = ua.match(/Firefox\/(\d+)/))) return { family: 'Firefox', major: match[1] };
    if ((match = ua.match(/Version\/(\d+).*Safari/))) return { family: 'Safari', major: match[1] };
    return { family: 'Other', major: '' };
  }

  function detectOs(ua) {
    if (/Android/i.test(ua)) return 'Android';
    if (/iPhone|iPad|iPod/i.test(ua)) return 'iOS/iPadOS';
    if (/Windows/i.test(ua)) return 'Windows';
    if (/Mac OS X|Macintosh/i.test(ua)) return 'macOS';
    if (/Linux/i.test(ua)) return 'Linux';
    return 'Other';
  }

  function collectClientMeta() {
    var ua = String(navigator.userAgent || '');
    var browser = detectBrowser(ua);
    var vw = Math.max(document.documentElement.clientWidth || 0, window.innerWidth || 0);
    var deviceType = vw < 600 ? 'mobile' : vw < 1024 ? 'tablet' : 'desktop';
    return {
      browserFamily: browser.family,
      browserMajor: browser.major,
      osFamily: detectOs(ua),
      deviceType: deviceType,
      screenBucket: bucket(window.screen && window.screen.width || vw),
      viewportBucket: bucket(vw),
      language: String(navigator.language || ''),
      timezone: (Intl.DateTimeFormat().resolvedOptions().timeZone || '')
    };
  }

  function buildAssessmentPayload(token) {
    return {
      submissionToken: token,
      assessmentConsent: el.pdpaConsent.checked,
      assessmentConsentVersion: state.bootstrap.assessmentConsentVersion,
      questionnaireVersion: state.bootstrap.questionnaireVersion,
      scoreModelVersion: state.bootstrap.scoreModelVersion,
      ageBand: el.ageBand.value,
      province: el.province.value,
      district: el.district.value,
      locationSource: 'self_reported',
      answers: Object.assign({}, state.answers),
      partC: Object.assign({}, state.partC),
      clientMeta: collectClientMeta(),
      honeypot: el.website.value
    };
  }

  function renderSafetyConditional() {
    var severe = selectedRadio('previousSevereReaction');
    var emergency = selectedRadio('emergencyNow');
    el.severeHistoryFields.classList.toggle('hidden', severe !== 'yes');
    el.foodAccessFields.classList.toggle('hidden', state.answers.foodReaction !== 'yes');
    el.safetyEmergencyNotice.classList.toggle('hidden', emergency !== 'yes');
  }

  function collectPartC() {
    var previous = selectedRadio('previousSevereReaction');
    var emergency = selectedRadio('emergencyNow');
    var partC = {
      emergencyNow: emergency,
      previousSevereReaction: previous,
      reactionTrigger: previous === 'yes' ? el.reactionTrigger.value : '',
      epinephrineStatus: previous === 'yes' ? el.epinephrineStatus.value : 'NOT_PRESCRIBED',
      hasEmergencyPlan: previous === 'yes' ? selectedRadio('hasEmergencyPlan') : 'unknown',
      foodAccessStatus: state.answers.foodReaction === 'yes' ? selectedRadio('foodAccessStatus') : 'NONE'
    };
    if (!partC.emergencyNow || !partC.previousSevereReaction) return { ok:false, error:'กรุณาตอบคำถามความปลอดภัย 2 ข้อแรกให้ครบ' };
    if (partC.previousSevereReaction === 'yes' && (!partC.reactionTrigger || !partC.epinephrineStatus || !partC.hasEmergencyPlan)) return { ok:false, error:'กรุณาตอบรายละเอียดประวัติแพ้รุนแรง ยาฉุกเฉิน และแผนรับมือให้ครบ' };
    if (state.answers.foodReaction === 'yes' && !partC.foodAccessStatus) return { ok:false, error:'กรุณาตอบคำถามเรื่องการเข้าถึงอาหาร' };
    return { ok:true, value:partC };
  }

  async function submitAssessment() {
    setError(el.safetyError, '');
    var collected = collectPartC();
    if (!collected.ok) { setError(el.safetyError, collected.error); return; }
    state.partC = collected.value;
    showOnly('processingScreen');
    if (!state.submissionToken) state.submissionToken = makeUuid();
    try {
      fetch(config.API_URL, { method:'POST', mode:'no-cors', body:transport.buildPostBody('assessment', buildAssessmentPayload(state.submissionToken)), referrerPolicy:'no-referrer' }).catch(function(){});
      var receipt = await pollReceipt('status', state.submissionToken);
      state.caseId = receipt.caseId; state.assessment = receipt.assessment;
      renderResult(receipt.assessment); showOnly('resultScreen');
    } catch (error) { setError(el.globalError, (error&&error.message)||'ไม่สามารถบันทึกข้อมูลได้'); showOnly('safetyFollowup'); }
  }

  function renderResult(assessment) {
    var copy = ux.buildResultCopy(assessment);
    el.riskNumber.textContent = String(assessment.riskIndex);
    el.riskGauge.style.setProperty('--risk-value', String(Math.max(0, Math.min(100, Number(assessment.riskIndex) || 0))));
    var gaugeColor = assessment.riskBand === 'REVIEW' ? '#004a80' : assessment.riskBand === 'WATCH' ? '#f0b84b' : '#4aa7d8';
    el.riskGauge.style.setProperty('--gauge-color', gaugeColor);
    el.riskTitle.textContent = copy.title;
    el.riskTitle.className = 'risk-title band-' + String(assessment.riskBand || '');
    el.resultDisclaimer.textContent = copy.disclaimer;
    el.certaintyText.textContent = copy.certainty; el.certaintyText.classList.toggle('hidden', !copy.certainty);
    el.caringText.textContent = copy.caring;
    el.reasonList.textContent = '';
    var reasons = assessment.riskReasons || [];
    if (!reasons.length) {
      var none = document.createElement('div'); none.className = 'reason-empty'; none.textContent = 'จากคำตอบครั้งนี้ยังไม่พบปัจจัยที่เพิ่มคะแนนในดัชนี หากลูกมีอาการที่เป็นซ้ำหรือผู้ปกครองกังวล ยังสามารถปรึกษากุมารแพทย์ได้'; el.reasonList.appendChild(none);
    } else reasons.forEach(function (reason) {
      var info = ux.explainRiskReason(reason);
      var card = document.createElement('article'); card.className = 'risk-factor-card';
      var heading = document.createElement('h4'); heading.textContent = info.title;
      var whyLabel = document.createElement('div'); whyLabel.className = 'factor-label'; whyLabel.textContent = 'เกี่ยวข้องอย่างไร';
      var why = document.createElement('p'); why.textContent = info.why;
      var actionLabel = document.createElement('div'); actionLabel.className = 'factor-label action-label'; actionLabel.textContent = 'ควรทำอย่างไร';
      var action = document.createElement('p'); action.className = 'factor-action'; action.textContent = info.action;
      card.appendChild(heading); card.appendChild(whyLabel); card.appendChild(why); card.appendChild(actionLabel); card.appendChild(action); el.reasonList.appendChild(card);
    });
    el.safetyResult.textContent = '';
    if (assessment.safetyLevel === 'EMERGENCY_NOW') {
      var emergency = document.createElement('div'); emergency.className = 'emergency-card'; emergency.innerHTML = '<strong>พบสัญญาณฉุกเฉินจากคำตอบ</strong><br>' + escapeHtml(copy.safety);
      el.safetyResult.appendChild(emergency);
      el.requestContactButton.classList.add('hidden');
    } else {
      el.requestContactButton.classList.remove('hidden');
      if (assessment.safetyLevel === 'SAFETY_FOLLOWUP' || assessment.safetyLevel === 'HIGH_SAFETY_PRIORITY') {
        var follow = document.createElement('div'); follow.className = 'notice warning'; follow.textContent = copy.safety; el.safetyResult.appendChild(follow);
      }
    }
  }

  function escapeHtml(text) {
    return String(text || '').replace(/[&<>"']/g, function (c) { return ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' })[c]; });
  }

  function printResult(saveAsPdf) {
    if (saveAsPdf) {
      el.printHint.textContent = 'เมื่อหน้าต่างพิมพ์เปิดขึ้น ให้เลือก “Save as PDF / บันทึกเป็น PDF” ที่ปลายทางเครื่องพิมพ์';
      el.printHint.classList.remove('hidden');
    } else {
      el.printHint.classList.add('hidden');
    }
    window.print();
  }

  async function submitContact() {
    setError(el.contactError, '');
    if (!el.contactConsent.checked) { setError(el.contactError, 'กรุณาให้ความยินยอมสำหรับการติดต่อกลับ'); return; }
    if (!el.parentName.value.trim() || !el.contactPhone.value.trim()) { setError(el.contactError, 'กรุณากรอกชื่อผู้ปกครองและเบอร์โทรศัพท์'); return; }
    var contactToken = makeUuid();
    var payload = {
      caseId: state.caseId,
      submissionToken: state.submissionToken,
      contactToken: contactToken,
      parentName: el.parentName.value,
      phone: el.contactPhone.value,
      preferredContactTime: el.preferredContactTime.value,
      contactConsent: el.contactConsent.checked,
      contactConsentVersion: state.bootstrap.contactConsentVersion
    };
    el.contactSubmit.disabled = true;
    try {
      fetch(config.API_URL, { method: 'POST', mode: 'no-cors', body: transport.buildPostBody('contact', payload), referrerPolicy: 'no-referrer' }).catch(function () {});
      await pollReceipt('contact-status', contactToken);
      el.doneTitle.textContent = 'รับคำขอติดต่อกลับเรียบร้อยแล้ว';
      el.doneMessage.textContent = 'ทีมโรงพยาบาลกรุงเทพหาดใหญ่จะดำเนินการตามข้อมูลและช่วงเวลาที่ท่านแจ้ง การส่งคำขอนี้ไม่ใช่ช่องทางฉุกเฉิน';
      showOnly('doneScreen');
    } catch (error) {
      el.contactSubmit.disabled = false; setError(el.contactError, (error && error.message) || 'ไม่สามารถส่งคำขอติดต่อกลับได้');
    }
  }

  async function bootstrap() {
    setError(el.globalError, '');
    if (!config || !config.API_URL || /REPLACE_WITH/.test(config.API_URL)) {
      setError(el.globalError, 'ผู้ดูแลระบบยังไม่ได้ตั้งค่า API_URL ใน config.js'); el.startButton.disabled = true; return;
    }
    try {
      state.bootstrap = await loadJsonp('bootstrap');
      el.systemModeBanner.classList.toggle('hidden', state.bootstrap.systemMode !== 'UAT');
      if (state.bootstrap.systemMode === 'UAT') el.systemModeBanner.textContent = 'UAT MODE — ใช้ข้อมูลทดสอบเท่านั้น ระบบยังไม่เปิดรับข้อมูลจริงจนกว่าจะผ่าน Production Readiness Gate';
      el.privacyLink.href = state.bootstrap.privacyUrl;
      if (el.donePrivacyLink) el.donePrivacyLink.href = state.bootstrap.privacyUrl;
      el.specialistLink.href = state.bootstrap.specialistUrl;
      el.province.textContent = '';
      var empty = document.createElement('option'); empty.value = ''; empty.textContent = 'เลือกจังหวัด'; el.province.appendChild(empty);
      (state.bootstrap.provinces || []).forEach(function (item) { var o = document.createElement('option'); o.value = item.code; o.textContent = item.label; el.province.appendChild(o); });
    } catch (error) {
      setError(el.globalError, error.message); el.startButton.disabled = true;
    }
  }

  el.startButton.addEventListener('click', function () { setError(el.landingError, ''); showOnly('pdpaScreen'); });
  el.pdpaContinue.addEventListener('click', function () {
    setError(el.pdpaError, '');
    if (!el.pdpaConsent.checked) { setError(el.pdpaError, 'กรุณาอ่านข้อมูลและให้ความยินยอมก่อนเริ่มประเมิน'); return; }
    showOnly('profileScreen');
  });
  el.pdpaCancel.addEventListener('click', function () { el.pdpaConsent.checked = false; showOnly('landingScreen'); });
  el.profileBack.addEventListener('click', function () { showOnly('pdpaScreen'); });
  el.profileNext.addEventListener('click', function () {
    setError(el.profileError, '');
    if (!el.ageBand.value || !el.province.value) { setError(el.profileError, 'กรุณาเลือกช่วงอายุและจังหวัด หรือเลือกไม่ประสงค์ระบุจังหวัด'); return; }
    state.questionIndex = 0; renderQuestion(); showOnly('questionScreen');
  });
  el.questionBack.addEventListener('click', function () { if (state.questionIndex > 0) { state.questionIndex -= 1; renderQuestion(); } });
  el.questionNext.addEventListener('click', function () {
    var q = ux.QUESTIONS[state.questionIndex];
    if (!state.answers[q.key]) return;
    if (state.questionIndex < ux.QUESTIONS.length - 1) { state.questionIndex += 1; renderQuestion(); return; }
    renderSafetyConditional(); showOnly('safetyFollowup');
  });
  document.addEventListener('change', function (event) { if (event.target && (event.target.name === 'previousSevereReaction' || event.target.name === 'emergencyNow')) renderSafetyConditional(); });
  el.safetyBack.addEventListener('click', function () { state.questionIndex = ux.QUESTIONS.length - 1; renderQuestion(); showOnly('questionScreen'); });
  el.safetySubmit.addEventListener('click', submitAssessment);
  el.printResultButton.addEventListener('click', function () { printResult(false); });
  el.savePdfButton.addEventListener('click', function () { printResult(true); });
  el.requestContactButton.addEventListener('click', function () { showOnly('contactScreen'); });
  el.contactBack.addEventListener('click', function () { showOnly('resultScreen'); });
  el.contactSubmit.addEventListener('click', submitContact);
  el.finishButton.addEventListener('click', function () {
    el.doneTitle.textContent = 'บันทึกการประเมินเรียบร้อยแล้ว';
    el.doneMessage.textContent = 'ขอบคุณที่ให้ความสำคัญกับสุขภาพของลูก หากมีข้อกังวลเพิ่มเติมสามารถติดต่อโรงพยาบาลกรุงเทพหาดใหญ่ได้ทุกเมื่อ';
    showOnly('doneScreen');
  });

  bootstrap();
})();
