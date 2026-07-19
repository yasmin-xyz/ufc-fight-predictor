// app/feedback/page.tsx
"use client";

import type { Metadata } from "next";
import { useState } from "react";
import Link from "next/link";
import Image from "next/image";

export default function FeedbackPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [category, setCategory] = useState("General feedback");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!message.trim()) {
      setError("Please enter a message before submitting.");
      return;
    }
    setError("");
    console.log({ name, email, category, message });
    setSubmitted(true);
  }

  return (
    <main className="meth-page">
      <nav className="nav">
        <Link href="/" className="nav-logo" style={{ textDecoration: "none" }}>
          <Image
            src="/android-chrome-192x192.png"
            alt="Pick'em Labs"
            width={30}
            height={30}
            className="nav-logo-img"
          />
          <div className="nav-logo-text">
            <div className="nav-logo-letters">
              <span className="nav-ltr" style={{ transform: "rotate(-2deg) translateY(1px)" }}>P</span>
              <span className="nav-ltr" style={{ transform: "rotate(1.5deg) translateY(-1px)" }}>I</span>
              <span className="nav-ltr" style={{ transform: "rotate(-1deg) translateY(1px)" }}>C</span>
              <span className="nav-ltr" style={{ transform: "rotate(2deg) translateY(-1px)" }}>K</span>
              <span className="nav-ltr" style={{ transform: "rotate(-1.5deg) translateY(0px)", margin: "0 1px" }}>&apos;</span>
              <span className="nav-ltr" style={{ transform: "rotate(1deg) translateY(1px)" }}>E</span>
              <span className="nav-ltr" style={{ transform: "rotate(-2deg) translateY(-1px)" }}>M</span>
            </div>
            <span className="nav-logo-labs">LABS</span>
          </div>
        </Link>
      </nav>

      <article className="meth-article">
        <header className="meth-hero">
          <div className="meth-eyebrow">Feedback</div>
          <h1 className="meth-title">Help us improve Pick&apos;em Labs</h1>
          <p className="meth-lead">
            Found a bug, have an idea, or just want to tell us what you think?
            Drop us a note below — we read everything.
          </p>
        </header>

        <div className="meth-divider" />

        {submitted ? (
          <div className="feedback-success">
            <div className="feedback-success-title">Thanks for the feedback</div>
            <p className="feedback-success-body">
              We&apos;ve received your message and will take a look.
            </p>
            <Link href="/" className="meth-back-link">
              ← Back to home
            </Link>
          </div>
        ) : (
          <form className="feedback-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label" htmlFor="name">
                Name <span className="form-label-optional">(optional)</span>
              </label>
              <input
                id="name"
                className="form-input"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="email">
                Email <span className="form-label-optional">(optional)</span>
              </label>
              <input
                id="email"
                className="form-input"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="category">
                Category
              </label>
              <div className="form-select-wrap">
                <select
                  id="category"
                  className="form-select"
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option>Bug report</option>
                  <option>Feature request</option>
                  <option>General feedback</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="message">
                Message <span className="form-label-required">*</span>
              </label>
              <textarea
                id="message"
                className="form-textarea"
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's on your mind?"
                rows={6}
              />
            </div>

            {error && <div className="form-error">{error}</div>}

            <button type="submit" className="form-submit">
              Submit feedback
            </button>
          </form>
        )}
      </article>
    </main>
  );
}