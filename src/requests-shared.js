// 메뉴 요청 게시판에서 학생 화면과 관리자 화면이 함께 쓰는 것

export const REQUEST_STATUS = {
  new: '검토 전',
  reviewing: '검토 중',
  yes: '들여올게요',
  no: '어려워요',
};

// 요청 카드의 이름·상태·한마디·답변 부분 만들기 (글자는 textContent로 안전하게)
export function fillRequestCard(li, r) {
  li.className = 'request-card' + (r.hidden ? ' is-hidden' : '');
  li.innerHTML = `
    <div><span class="req-name"></span><span class="req-status"></span></div>
    <div class="req-note"></div>
  `;
  li.querySelector('.req-name').textContent = r.name;
  const status = li.querySelector('.req-status');
  status.textContent = REQUEST_STATUS[r.status];
  status.classList.add(r.status);
  const note = li.querySelector('.req-note');
  if (r.note) note.textContent = r.note;
  else note.remove();

  if (r.reply) {
    const reply = document.createElement('div');
    reply.className = 'req-reply';
    reply.textContent = `매점부: ${r.reply}`;
    li.appendChild(reply);
  }
}
