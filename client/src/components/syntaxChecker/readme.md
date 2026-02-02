# CL Syntax Checker

The CL syntax checker is installed as a Code for IBM i component in the CL extension. Its purpose is to check the syntax for CL programs and publish errors as diagnostics to the Problems view.

## Changelog

All notable changes to the CL Syntax Checker component are documented in this file.

## [1.1]

### Fixed
- Fixed type compatibility issues with `writeStreamfileRaw` by using `TextEncoder().encode()` instead of `Buffer.from()`.
- Corrected SQL escaping for CL statements by properly doubling single quotes.
- Fixed `withTempDirectory` callback return type to properly handle Promise<void>.
- Fixed config access by using proper API methods instead of accessing private properties.
- Resolved authentication issues when accessing connection configuration.
- Inlined the prototype for _CPYBYTES MI Instruction since "compile from IFS" has issues with that.
- Corrected the default syntax-check option. It now checks for Interactive CL Commands such as those normally run on Command Entry. Previously, it used the looser "Syntax check any command" which caused issues with CL program editing vs "run CL command now" operations.

### Changed
- Updated `check()` method to return array of `ClSyntaxError` objects instead of single result
- Improved error handling in installation process with proper success tracking
- Enhanced logging throughout installation and checking processes
- Refactored library and temp directory retrieval to use connection config API

### Added
- Version checking in `checkCL_UDTFInstalled()` to verify UDTF is up-to-date
- Comprehensive error checking for compilation, binding, and SQL execution steps
- Support for multiple syntax error messages per CL statement check
- Timeout handling for SYSROUTINES query operations

## [1.0] - Initial Release

### Added
- CL Syntax Checker component for real-time CL statement validation
- C++ module (`CLSYNCHECK`) CL syntax validation module via the SQL UDTF
- SQL UDTF (`CL_SYNTAX_CHECKER`) for SQL-based syntax checking interface
- Integration with VS Code diagnostics system
- Command registration for manual syntax checking (`vscode-clle.CLSyntaxCheck`)
- Automatic installation of required IBM i components
- Support for escaping SQL statements with embedded quotes
- Keyboard shortcut support (Ctrl+F5/Cmd+F5) for syntax checking

### Technical Details
- Utilizes IBM i CRTCPPMOD and CRTPGM for component compilation
- Implements temporary directory management for safe file operations
- Provides comprehensive error reporting with message IDs and descriptions
- Supports version checking for component updates