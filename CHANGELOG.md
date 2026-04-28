# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-28

### Added

- Bit-mask pre-filtering to skip non-matching paths
- Fuzzy matching with boundary and camelCase bonuses
- Case-sensitive mode auto-detection from query
- Async chunked loading for large file lists
- Top-N result optimization without full sorting
- Test file deprioritization in search results
- Zero-dependency TypeScript implementation
- Cross-runtime support (Deno, Node.js, browsers)
- Batch search for multiple queries
- FuzzyFinder class with load(), loadAsync(), and search() methods

### Infrastructure

- Test suite with coverage for core algorithms
- GitHub Actions CI for format lint typecheck
- Automated JSR publishing workflow for package release
- npm package build setup with unbuild tool
- API reference documentation and usage guide files
- Interactive browser based demo example for users
- Line ending normalization for cross platform consistency

---

[Unreleased]: https://github.com/NeaByteLab/Fuzzy-Finder/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/NeaByteLab/Fuzzy-Finder/releases/tag/v0.1.0
