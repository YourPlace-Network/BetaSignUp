package db

import (
	"crypto/tls"
	"crypto/x509"
	"database/sql"
	"fmt"
	mysql2 "github.com/go-sql-driver/mysql"
	"io/ioutil"
	"time"
)

type MySQL struct {
	DB *sql.DB
}

func (mysql *MySQL) Init(dsn string, caCertFileName string) {
	rootCAs := x509.NewCertPool() // https://github.com/go-sql-driver/mysql/pull/101
	{
		pem, err := ioutil.ReadFile(caCertFileName)
		if err != nil {
			panic(err.Error())
		}
		if ok := rootCAs.AppendCertsFromPEM(pem); !ok {
			panic("Failed to append PEM")
		}
	}
	/*clientCerts := make([]tls.Certificate, 0, 1)
	{
		certs, err := tls.LoadX509KeyPair("client-cert.pem", "client-key.pem")
		if err != nil {
			panic(err.Error())
		}
		clientCerts = append(clientCerts, certs)
	}*/
	mysql2.RegisterTLSConfig("custom", &tls.Config{
		RootCAs: rootCAs,
		//Certificates: clientCerts,
	})
	db, err := sql.Open("mysql", dsn)
	if err != nil {
		panic(err)
	}
	db.SetConnMaxLifetime(time.Minute * 3)
	db.SetMaxOpenConns(10)
	db.SetMaxIdleConns(10)
	mysql.DB = db
}

func (mysql *MySQL) Setup() {
	_, err := mysql.DB.Query(`CREATE DATABASE IF NOT EXISTS signup CHARACTER SET utf8;`)
	if err != nil {
		panic(err.Error())
	}
	query := `CREATE TABLE IF NOT EXISTS signup.users (
		email VARCHAR(255) NOT NULL,
    	algoAddress VARCHAR(60),
    	created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    	PRIMARY KEY (email)
	);`
	_, err = mysql.DB.Query(query)
	if err != nil {
		panic(err.Error())
	}
}

func (mysql *MySQL) DoesContactExist(email string) bool {
	query := `SELECT EXISTS(SELECT * FROM signup.users WHERE email = ?)`
	rows, err := mysql.DB.Query(query, email)
	if err != nil {
		fmt.Println(err.Error())
	}
	defer rows.Close()

	return false
}

func (mysql *MySQL) InsertContact(email string, algoAddress string) {
	query := `INSERT INTO signup.users (email, algoAddress) VALUES (?, ?);`
	rows, err := mysql.DB.Query(query, email, algoAddress)
	if err != nil {
		fmt.Println(err.Error())
	}
	defer rows.Close()
}
