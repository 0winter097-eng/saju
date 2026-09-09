// Keep the form local even if the calculation module cannot load.
(() => {
 const form = document.querySelector('#birth-form');
 form.addEventListener('submit', event => event.preventDefault());
 const status = document.querySelector('#startup-status');
 const retry = document.querySelector('#reload-app');
 retry.addEventListener('click', () => window.location.reload());
 import('./app.js?v=0.2.0').catch(() => {
  status.hidden = false;
  status.className = 'error';
  status.textContent = window.location.protocol === 'file:'
   ? '파일을 더블클릭해서 열면 계산 기능을 사용할 수 없어요. 압축을 푼 폴더의 README 실행 방법에 따라 서버를 실행한 뒤 http://localhost:8000으로 접속해 주세요.'
   : '계산 기능을 불러오지 못했습니다. 아래의 다시 불러오기를 눌러 주세요. 내려받아 사용 중이라면 ZIP 전체를 압축 해제했는지 확인해 주세요.';
  retry.hidden = false;
 });
})();
