// app/feedback/page.tsx
"use client";

import { useState } from "react";
import Link from "next/link";
import HomeLogoLink from "../components/HomeLogoLink";
import Dropdown from "../components/Dropdown";

const CATEGORIES = ["Bug report", "Feature request", "General feedback"];

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
      <nav className="nav reveal-nav">
        <HomeLogoLink />
      </nav>

      <article className="meth-article reveal-meth-article">
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
              <Dropdown
                id="category"
                ariaLabel="Feedback category"
                options={CATEGORIES.map((cat) => ({ key: cat, label: cat, value: cat }))}
                selectedKey={category}
                onSelect={(option) => setCategory(option.value)}
              />
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
