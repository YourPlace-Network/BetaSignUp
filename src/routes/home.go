package routes

import (
	"YourPlace/src/core/db"
	"YourPlace/src/core/security"
	"fmt"
	"github.com/gin-gonic/gin"
	"net/http"
	"strings"
)

func HomeRoutes(router *gin.Engine, database *db.MySQL, secret string, sitekey string, phone string) {
	type Signup struct {
		Email           string `json:"email" binding:"required"`
		CaptchaResponse string `json:"captchaResponse" binding:"required"`
		AlgoAddress     string `json:"algoAddress"`
	}

	router.GET("/", func(c *gin.Context) {
		c.HTML(http.StatusOK, "src/templates/pages/home.tmpl", gin.H{
			"sitekey": sitekey,
			"phone":   phone,
		})
	})

	router.GET("/success", func(c *gin.Context) {
		c.HTML(http.StatusOK, "src/templates/pages/success.tmpl", gin.H{})
	})

	router.GET("/failure", func(c *gin.Context) {
		c.HTML(http.StatusBadRequest, "src/templates/pages/failure.tmpl", gin.H{})
	})

	router.GET("/duplicate", func(c *gin.Context) {
		c.HTML(http.StatusConflict, "src/templates/pages/duplicate.tmpl", gin.H{})
	})

	router.POST("/signup", func(c *gin.Context) {
		signup := Signup{}
		err := c.BindJSON(&signup)
		if err != nil {
			c.AbortWithStatus(400)
			return
		}
		if !security.CaptchaVerify(secret, sitekey, signup.CaptchaResponse) {
			fmt.Println("Captcha verification failure")
			c.AbortWithStatus(400)
			return
		}
		fmt.Println("email: " + signup.Email)
		fmt.Println("address: " + signup.AlgoAddress)
		if !security.ValidateEmail(signup.Email) {
			fmt.Println("Email verification failure")
			c.AbortWithStatus(400)
			return
		}
		if signup.AlgoAddress != "" {
			if !security.ValidateAlgoAddress(signup.AlgoAddress) {
				fmt.Println("Algo address verification failure")
				signup.AlgoAddress = "none"
				c.AbortWithStatus(400)
				return
			}
		}
		exists := database.DoesContactExist(signup.Email)
		if !exists {
			database.InsertContact(strings.ToLower(signup.Email), signup.AlgoAddress)
			c.Redirect(http.StatusFound, "/success")
		} else {
			c.Redirect(http.StatusFound, "/duplicate")
		}
	})
}
