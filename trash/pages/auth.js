import { setAuthState } from '../utils/state.js';
import { showToast } from '../components/toast.js';

export async function AuthPage(){
  window.kinaLogin = (e) => {
    e.preventDefault();
    const form = e.target.closest('form');
    const email = form.querySelector('input[name="email"]').value.trim();
    const pass = form.querySelector('input[name="password"]').value;
    if(!email || !pass){ showToast('Email and password are required','error'); return; }
    const role = email.includes('admin') ? 'admin' : (email.includes('staff') ? 'staff' : 'guest');
    setAuthState({ user: { email }, role });
    showToast(`Welcome ${email.split('@')[0]}!`, 'success');
    location.hash = '#/';
  };

  window.kinaRegister = (e) => {
    e.preventDefault();
    const form = e.target.closest('form');
    const email = form.querySelector('input[name="email"]').value.trim();
    const pass = form.querySelector('input[name="password"]').value;
    const name = form.querySelector('input[name="name"]').value.trim();
    if(!email || !pass || !name){ showToast('All fields are required','error'); return; }
    showToast('Account created. Please log in.', 'success');
  };

  return `
  <section class="container">
    <div class="section-head"><h2>Login</h2></div>
    <form class="form" onsubmit="kinaLogin(event)">
      <div class="form-row">
        <div><label>Email</label><input class="input" type="email" name="email" required></div>
        <div><label>Password</label><input class="input" type="password" name="password" required></div>
      </div>
      <div style="margin-top:12px"><button class="btn primary" type="submit">Login</button></div>
    </form>
  </section>
  <section class="container">
    <div class="section-head"><h2>Register</h2></div>
    <form class="form" onsubmit="kinaRegister(event)">
      <div class="form-row">
        <div><label>Name</label><input class="input" type="text" name="name" required></div>
        <div><label>Email</label><input class="input" type="email" name="email" required></div>
        <div><label>Password</label><input class="input" type="password" name="password" required></div>
      </div>
      <div style="margin-top:12px"><button class="btn" type="submit">Create Account</button></div>
    </form>
  </section>`;
}





