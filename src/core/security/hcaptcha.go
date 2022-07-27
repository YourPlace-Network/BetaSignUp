package security

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"net/url"
	"strconv"
	"strings"
)

func CaptchaVerify(secret string, sitekey string, response string) bool {
	verifyURL := "https://hcaptcha.com"
	resource := "/siteverify"
	data := url.Values{}
	data.Set("response", response)
	data.Set("secret", secret)
	data.Set("sitekey", sitekey)
	u, _ := url.ParseRequestURI(verifyURL)
	u.Path = resource
	urlStr := u.String()
	client := &http.Client{}
	r, err := http.NewRequest(http.MethodPost, urlStr, strings.NewReader(data.Encode()))
	if err != nil {
		fmt.Println("captcha failed: " + err.Error())
		return false
	}
	r.Header.Add("Content-Type", "application/x-www-form-urlencoded")
	r.Header.Add("Content-Length", strconv.Itoa(len(data.Encode())))
	resp, err := client.Do(r)
	if err != nil {
		fmt.Println("captcha failed 2: " + err.Error())
		return false
	}
	defer func() {
		if resp.Body != nil {
			resp.Body.Close()
		}
	}()
	var buf bytes.Buffer
	_, err = buf.ReadFrom(resp.Body)
	if err != nil {
		fmt.Println("captcha failed 3: " + err.Error())
		return false
	}
	respString := buf.String()
	type CaptchaResponse struct {
		Success   bool     `json:"success"`
		Challenge string   `json:"challenge_ts"`
		Hostname  string   `json:"hostname"`
		Credit    bool     `json:"credit"`
		Error     []string `json:"error-codes"`
	}
	var captcha CaptchaResponse
	err = json.Unmarshal([]byte(respString), &captcha)
	if err != nil {
		fmt.Println("captcha failed 4: " + err.Error())
		return false
	}
	if captcha.Success == true {
		return true
	}
	return false
}
