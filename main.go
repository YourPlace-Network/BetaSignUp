package main

import (
	"YourPlace/src/core/db"
	"YourPlace/src/routes"
	"context"
	"embed"
	"github.com/gin-contrib/gzip"
	"github.com/gin-gonic/gin"
	"gopkg.in/yaml.v3"
	"html/template"
	"io/fs"
	"io/ioutil"
	"log"
	"net/http"
	"os"
	"os/signal"
	"regexp"
	"strconv"
	"strings"
	"syscall"
	"time"
)

//go:embed src/templates
var templateFS embed.FS

//go:embed src/www
var wwwFS embed.FS

func main() {
	// Initialize Config File
	type Conf struct {
		Server struct {
			Port  int    `yaml:"port"`
			Cert  string `yaml:"cert"`
			Key   string `yaml:"key"`
			Phone string `yaml:"phone"`
		}
		Hcaptcha struct {
			SiteKey string `yaml:"sitekey"`
			Secret  string `yaml:"secret"`
		}
		Mysql struct {
			Host     string `yaml:"host"`
			Port     int    `yaml:"port"`
			Database string `yaml:"database"`
			Username string `yaml:"username"`
			Password string `yaml:"password"`
			CA       string `yaml:"ca"`
		}
	}
	conf := Conf{}
	config, err := ioutil.ReadFile("config.yaml")
	if err != nil {
		log.Fatal(err)
	}
	err = yaml.Unmarshal(config, &conf)
	if err != nil {
		log.Fatal(err)
	}
	// Initialize Database Connection
	database := new(db.MySQL)
	dsn := conf.Mysql.Username + ":" + conf.Mysql.Password + "@tcp(" + conf.Mysql.Host + ":" + strconv.Itoa(conf.Mysql.Port) + ")/"
	dsn += conf.Mysql.Database + "?tls=custom&timeout=120s"
	database.Init(dsn, conf.Mysql.CA)
	database.Setup()
	// Configure Gin Server
	gin.SetMode(gin.ReleaseMode)
	gin.DisableConsoleColor()
	router := gin.Default()
	router.Use(gin.Logger())
	router.Use(gin.Recovery())
	router.Use(gzip.Gzip(gzip.DefaultCompression))
	router.StaticFS("/static", staticFS())
	LoadTemplates(router, templateFS, "src/templates/*tmpl")
	router.MaxMultipartMemory = 8 << 20
	routes.HomeRoutes(router,
		database,
		conf.Hcaptcha.Secret,
		conf.Hcaptcha.SiteKey,
		conf.Server.Phone)
	// Start Gin Server
	// https://gin-gonic.com/docs/examples/graceful-restart-or-stop/
	srv := &http.Server{
		Addr:    ":" + strconv.Itoa(conf.Server.Port),
		Handler: router,
	}
	go func() {
		//if err := srv.ListenAndServeTLS(conf.Server.Cert, conf.Server.Key); err != nil && err != http.ErrServerClosed {
		if err := srv.ListenAndServe(); err != nil && err != http.ErrServerClosed {
			log.Fatalf("listen: %s\n", err)
		}
	}()

	// Shutdown Handlers
	quit := make(chan os.Signal) // Wait for interrupt signal to gracefully shutdown the server with a timeout of 5 seconds.
	// kill (no param) default send syscanll.SIGTERM; kill -2 is syscall.SIGINT; kill -9 is syscall. SIGKILL but can't be caught, so don't need to add it
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()
	defer database.DB.Close()
	if err := srv.Shutdown(ctx); err != nil {
		log.Fatal("Server Shutdown:", err)
	}
	// Catching ctx.Done() Timeout of 5 seconds
	select {
	case <-ctx.Done():
		log.Println("Timeout of 5 seconds")
	}
	os.Exit(0)
}

func staticFS() http.FileSystem {
	// https://github.com/gin-contrib/static/issues/19#issuecomment-963604838
	sub, err := fs.Sub(wwwFS, "src/www")
	if err != nil {
		panic(err)
	}
	return http.FS(sub)
}

func LoadTemplates(engine *gin.Engine, embedFS embed.FS, pattern string) {
	// https://github.com/gin-gonic/gin/issues/2795
	root := template.New("")
	loadFunc := func(funcMap template.FuncMap, rootTemplate *template.Template, embedFS embed.FS, pattern string) error {
		pattern = strings.ReplaceAll(pattern, ".", "\\.")
		pattern = strings.ReplaceAll(pattern, "*", ".*")
		err := fs.WalkDir(embedFS, ".", func(path string, d fs.DirEntry, walkErr error) error {
			if walkErr != nil {
				return walkErr
			}
			if matched, _ := regexp.MatchString(pattern, path); !d.IsDir() && matched {
				data, readErr := embedFS.ReadFile(path)
				if readErr != nil {
					return readErr
				}
				t := root.New(path).Funcs(engine.FuncMap)
				if _, parseErr := t.Parse(string(data)); parseErr != nil {
					return parseErr
				}
			}
			return nil
		})
		return err
	}
	tmpl := template.Must(root, loadFunc(engine.FuncMap, root, embedFS, pattern))
	engine.SetHTMLTemplate(tmpl)
}
