package main

import (
	"fmt"
)

func main() {
	// Initialize XAuth
	auth := NewXAuth(1, "your_app_secret_here", "http://localhost:3310")

	fmt.Println("--- XAuth Omega Go SDK Demo ---")

	// 1. Public Update Check
	fmt.Print("[1] Public Update Check: ")
	release, err := auth.GetLatestRelease("stable")
	if err == nil && release.Success {
		fmt.Printf("Latest version: %s\n", release.Version)
	} else {
		fmt.Printf("Failed\n")
	}

	// 2. Secure Version Verification
	fmt.Print("[2] Secure Version Verification: ")
	ver, err := auth.CheckVersion("1.0.0", "stable")
	if err == nil && ver.Success {
		if ver.UpdateAvailable {
			fmt.Printf("Update available to %s!\n", ver.Version)
		} else {
			fmt.Printf("Up to date.\n")
		}
	} else {
		fmt.Printf("Failed\n")
	}

	// 3. License Validation
	fmt.Print("[3] License Validation: ")
	result := auth.ValidateLicense("XXXX-XXXX-XXXX-XXXX")
	if result.Success {
		fmt.Printf("Valid! Expires: %s\n", result.Expiry)
	} else {
		fmt.Printf("Invalid: %s\n", result.Message)
	}
}
