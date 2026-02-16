# Contributing to the Gramps Web Frontend

Welcome, and thank you for your interest in contributing to the Gramps Web frontend! Your efforts help make this project better for everyone.

## How to Contribute

### Reporting Issues
- Found a bug or have a feature request? [Open an issue](https://github.com/gramps-project/gramps-web/issues) to let us know!
- Provide as much detail as possible, including steps to reproduce the issue or a clear description of the feature idea.

### Proposing Features
- **Before implementing a new feature**, please open an issue to discuss your proposal. This helps avoid duplicate work and ensures alignment with project goals.

### Development Guidelines
- Follow the [developer documentation](https://www.grampsweb.org/development/dev/) for setup, coding standards, and API details.
- Ensure your changes include appropriate tests and documentation updates where applicable.

### Lint and Formatting Gate
- Run `npm run lint` before opening a PR. This runs both `lint:eslint` and `lint:prettier`.
- Keep lint scope intact. Do not bypass checks by excluding files or weakening rules without explicit maintainer approval.
- Test-only exceptions must be intentional and documented in code review notes.

### Lint Escalation Path
- If lint fails because of a true code issue, fix the issue in the same change.
- If lint fails because of policy ambiguity or a likely false positive, open an issue with:
  - the exact command output,
  - affected files,
  - proposed rule/policy adjustment and rationale.
- Wait for maintainer approval before changing lint policy.

### Code of Conduct
- Please read and adhere to our [Code of Conduct](CODE_OF_CONDUCT.md) to ensure a welcoming and inclusive environment for all contributors.


### Communication
- For general discussions or questions, join our [Discourse forum](https://gramps.discourse.group/).
- Engage respectfully and collaboratively with the community.

We look forward to your contributions!
