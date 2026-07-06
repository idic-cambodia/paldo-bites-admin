<script setup lang="ts">
import { ref } from "vue";
import { useRouter } from "vue-router";
import { useAuthStore } from "@/stores/auth";

const router = useRouter();
const auth = useAuthStore();

const identifier = ref("");
const password = ref("");
const error = ref("");

async function handleSubmit() {
    error.value = "";

    if (!identifier.value.trim() || !password.value.trim()) {
        error.value = "Please enter username and password.";
        return;
    }

    try {
        await auth.login({
            identifier: identifier.value.trim(),
            password: password.value
        });
        router.push("/");
    } catch (err) {
        const message = err instanceof Error ? err.message : "Unable to login. Try again.";
        error.value = message;
    }
}
</script>

<template>
    <section class="login-page">
        <div class="bg-layer"></div>
        <div class="login-card">
            <p class="eyebrow">Paldo Admin</p>
            <h1>Welcome back</h1>
            <p class="sub">Sign in to manage menu, orders, and settings.</p>

            <form class="form" @submit.prevent="handleSubmit">
                <label>
                    <span>Username</span>
                    <input v-model="identifier" type="text" autocomplete="username" placeholder="Enter your username" :disabled="auth.loading" />
                </label>

                <label>
                    <span>Password</span>
                    <input
                        v-model="password"
                        type="password"
                        autocomplete="current-password"
                        placeholder="Enter your password"
                        :disabled="auth.loading"
                    />
                </label>

                <p v-if="error" class="error">{{ error }}</p>

                <button type="submit" class="btn-login" :disabled="auth.loading">
                    {{ auth.loading ? "Signing in..." : "Sign in" }}
                </button>
            </form>
        </div>
    </section>
</template>

<style scoped>
.login-page {
    position: relative;
    min-height: 100vh;
    display: grid;
    place-items: center;
    padding: 24px;
    overflow: hidden;
    background: linear-gradient(160deg, #f2eadf 0%, #e9ddd0 45%, #f9f6ef 100%);
}

.bg-layer {
    position: absolute;
    inset: 0;
    background:
        radial-gradient(circle at 12% 18%, rgba(200, 71, 42, 0.2), transparent 30%),
        radial-gradient(circle at 85% 80%, rgba(156, 53, 32, 0.14), transparent 35%);
    pointer-events: none;
}

.login-card {
    position: relative;
    z-index: 1;
    width: min(100%, 440px);
    background: rgba(255, 255, 255, 0.86);
    backdrop-filter: blur(10px);
    border: 1px solid rgba(255, 255, 255, 0.7);
    border-radius: 20px;
    box-shadow: 0 18px 48px rgba(71, 41, 22, 0.12);
    padding: 30px;
}

.eyebrow {
    font-size: 11px;
    font-weight: 700;
    letter-spacing: 0.09em;
    text-transform: uppercase;
    color: var(--brand);
}

h1 {
    margin-top: 6px;
    font-size: 38px;
    line-height: 1;
    color: #2f1809;
}

.sub {
    margin-top: 10px;
    margin-bottom: 22px;
    color: #6b5744;
    font-size: 14px;
}

.form {
    display: grid;
    gap: 14px;
}

label {
    display: grid;
    gap: 6px;
}

label span {
    font-size: 12px;
    font-weight: 600;
    color: #523f2e;
}

input {
    width: 100%;
    height: 44px;
    border-radius: 12px;
    border: 1px solid #d8cab9;
    background: #fff;
    padding: 0 13px;
    font-size: 14px;
    outline: none;
    transition:
        border-color 0.15s,
        box-shadow 0.15s;
}

input:focus {
    border-color: var(--brand);
    box-shadow: 0 0 0 3px rgba(200, 71, 42, 0.15);
}

.btn-login {
    margin-top: 4px;
    height: 46px;
    border-radius: 12px;
    background: linear-gradient(120deg, var(--brand) 0%, var(--brand-deep) 100%);
    color: #fff;
    font-size: 14px;
    font-weight: 700;
    transition:
        transform 0.15s,
        filter 0.15s;
}

.btn-login:hover:not(:disabled) {
    transform: translateY(-1px);
    filter: brightness(1.03);
}

.btn-login:disabled {
    opacity: 0.7;
    cursor: not-allowed;
}

.error {
    color: #991b1b;
    font-size: 12px;
    font-weight: 600;
    background: #fee2e2;
    border: 1px solid #fecaca;
    border-radius: 10px;
    padding: 8px 10px;
}

@media (max-width: 520px) {
    .login-card {
        padding: 22px;
    }
    h1 {
        font-size: 32px;
    }
}
</style>
