import {css} from 'lit'

export const aiCardStyles = css`
  .ai-card {
    background-color: var(--grampsjs-color-shade-240);
    border-radius: 12px;
    border-left: 4px solid var(--md-sys-color-primary, #6750a4);
    padding: 20px 24px;
  }

  .ai-card-header {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-bottom: 12px;
    color: var(--grampsjs-body-font-color);
  }

  .ai-card-header md-icon {
    --md-icon-size: 20px;
    color: var(--md-sys-color-primary, #6750a4);
  }

  .ai-card-title {
    font-size: 14px;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .ai-card-content {
    font-size: 16px;
    line-height: 26px;
    font-weight: 340;
    color: var(--grampsjs-body-font-color);
    white-space: pre-wrap;
  }

  .ai-card-content a {
    color: var(--md-sys-color-primary, #6750a4);
    text-decoration: none;
  }

  .ai-card-content a:hover {
    text-decoration: underline;
  }
`

export const typingDotsStyles = css`
  .typing-dots {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 20px;
    gap: 4px;
  }

  .typing-dot {
    width: 8px;
    height: 8px;
    background-color: var(--grampsjs-body-font-color-50);
    border-radius: 50%;
    animation: aiTypingFlash 1.4s infinite ease-in-out both;
  }

  .typing-dot:nth-child(1) {
    animation-delay: -0.32s;
  }

  .typing-dot:nth-child(2) {
    animation-delay: -0.16s;
  }

  @keyframes aiTypingFlash {
    0%,
    80%,
    100% {
      opacity: 0;
    }
    40% {
      opacity: 1;
    }
  }
`
