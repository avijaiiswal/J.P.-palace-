const nav = document.getElementById('nav');
  window.addEventListener('scroll', () => {
    nav.style.background = window.scrollY > 40
      ? 'rgba(15,36,34,0.96)'
      : 'linear-gradient(to bottom, rgba(15,36,34,0.94), rgba(15,36,34,0))';
  });

  if(!window.matchMedia('(prefers-reduced-motion: reduce)').matches){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in'); io.unobserve(e.target); } });
    }, {threshold:0.12});
    document.querySelectorAll('.reveal').forEach(el=>io.observe(el));
  } else {
    document.querySelectorAll('.reveal').forEach(el=>el.classList.add('in'));
  }

  // ---- Booking logic ----
  const roomSelect = document.getElementById('f-room');
  const priceOut = document.getElementById('price-out');
  const checkinEl = document.getElementById('f-checkin');
  const checkoutEl = document.getElementById('f-checkout');

  function nights(){
    const ci = new Date(checkinEl.value);
    const co = new Date(checkoutEl.value);
    const diff = Math.round((co - ci) / 86400000);
    return diff > 0 ? diff : 1;
  }
  function updatePrice(){
    const rate = parseInt(roomSelect.value, 10);
    const n = (checkinEl.value && checkoutEl.value) ? nights() : 1;
    priceOut.textContent = '₹' + (rate * n).toLocaleString('en-IN');
  }
  roomSelect.addEventListener('change', updatePrice);
  checkinEl.addEventListener('change', updatePrice);
  checkoutEl.addEventListener('change', updatePrice);
  updatePrice();

  function selectRoom(rate){
    roomSelect.value = rate;
    updatePrice();
    document.getElementById('booking').scrollIntoView({behavior:'smooth'});
  }

  function showMsg(text, ok){
    const el = document.getElementById('book-msg');
    el.innerHTML = text;
    el.className = 'book-msg show ' + (ok ? 'ok' : 'err');
  }

  async function submitBooking(){
    const name = document.getElementById('f-name').value.trim();
    const phone = document.getElementById('f-phone').value.trim();
    const ci = checkinEl.value;
    const co = checkoutEl.value;
    const guests = document.getElementById('f-guests').value;
    const roomLabel = roomSelect.options[roomSelect.selectedIndex].text;

    if(!name || !phone || !ci || !co){
      showMsg('Please fill in your name, phone, and both dates before reserving.', false);
      return;
    }
    if(new Date(co) <= new Date(ci)){
      showMsg('Check-out date must be after check-in date.', false);
      return;
    }

    const bookingId = 'JPP-' + Date.now().toString().slice(-6);
    const booking = { bookingId, name, phone, checkin: ci, checkout: co, guests, room: roomLabel, total: priceOut.textContent, createdAt: new Date().toISOString() };

    try{
      await window.storage.set('booking:' + bookingId, JSON.stringify(booking), true);
      // maintain local guest history
      const mineRaw = localStorageFallback('get');
      const mine = mineRaw ? JSON.parse(mineRaw) : [];
      mine.push(booking);
      localStorageFallback('set', JSON.stringify(mine));
      renderMyBookings(mine);

      showMsg('Reservation confirmed. Your booking ID is <span class="booking-id">' + bookingId + '</span>. Please carry a valid photo ID at check-in.', true);
      document.getElementById('f-name').value = '';
      document.getElementById('f-phone').value = '';
    } catch(err){
      showMsg('Something went wrong saving your reservation. Please try again or call +91 91044 88578.', false);
      console.error(err);
    }
  }

  // simple in-memory fallback so "my bookings" list works within this session
  let sessionBookings = [];
  function localStorageFallback(mode, val){
    if(mode === 'set'){ sessionBookings = JSON.parse(val); return; }
    return sessionBookings.length ? JSON.stringify(sessionBookings) : null;
  }

  function renderMyBookings(list){
    const wrap = document.getElementById('my-bookings-wrap');
    const ul = document.getElementById('my-bookings-list');
    ul.innerHTML = '';
    list.slice().reverse().forEach(b=>{
      const li = document.createElement('li');
      li.innerHTML = '<b>' + b.bookingId + '</b> — ' + b.room + ' · ' + b.checkin + ' to ' + b.checkout + ' · ' + b.total;
      ul.appendChild(li);
    });
    wrap.style.display = list.length ? 'block' : 'none';
  }
