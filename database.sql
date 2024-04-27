-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Generation Time: Feb 25, 2024 at 08:30 AM
-- Server version: 10.4.25-MariaDB
-- PHP Version: 8.1.10

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Database: `cruixx_mate_diary`
--
CREATE OR REPLACE DATABASE `cruixx_mate_diary` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_general_ci;
USE `cruixx_mate_diary`;

-- --------------------------------------------------------

--
-- Table structure for table ``
--

CREATE TABLE Company (
    id_company INT AUTO_INCREMENT,
    nama VARCHAR(255) NOT NULL,
    status VARCHAR(255) NOT NULL, -- ini buat free / premium
    PRIMARY KEY (id_company)
);

--
-- Table structure for table `User`
--

CREATE TABLE User (
    id_user INT AUTO_INCREMENT,
    id_company INT NOT NULL,
    username VARCHAR(255) NOT NULL unique,
    password VARCHAR(255) NOT NULL,
    nickname VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    role VARCHAR(255) NOT NULL,
    PRIMARY KEY (id_user),
    KEY id_company (id_company),
    FOREIGN KEY (id_company) REFERENCES Company(id_company)
);

--
-- Table structure for table `Animal`
--

CREATE TABLE Animal (
    id_animal INT AUTO_INCREMENT,
    id_company INT NOT NULL,
    nama_panggilan VARCHAR(255),
    nama_hewan VARCHAR(255) NOT NULL,
    gender VARCHAR(255) NOT NULL,
    kode_hewan VARCHAR(255) NOT NULL,
    asal_hewan VARCHAR(255),
    status_is_child INT NOT NULL,
    PRIMARY KEY (id_animal),
    KEY id_company (id_company),
    FOREIGN KEY (id_company) REFERENCES Company(id_company)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `Family`
--

CREATE TABLE Family (
    id_fam INT AUTO_INCREMENT,
    id_company INT NOT NULL,
    parent_fem INT NOT NULL,
    parent_male INT NOT NULL,
    PRIMARY KEY (id_fam),
    KEY parent_fem (parent_fem),
    KEY parent_male (parent_male),
    KEY id_company (id_company),
    FOREIGN KEY (id_company) REFERENCES Company(id_company),
    FOREIGN KEY (parent_fem) REFERENCES Animal(id_animal),
    FOREIGN KEY (parent_male) REFERENCES Animal(id_animal)
);

--
-- Table structure for table `Child`
--

CREATE TABLE Child (
    id_child INT AUTO_INCREMENT,
    id_fam INT NOT NULL,
    PRIMARY KEY (id_child),
    KEY id_fam (id_fam),
    FOREIGN KEY (id_fam) REFERENCES Family(id_fam)
);



--
-- Table structure for table `H_kawin`
--

CREATE TABLE H_kawin (
    id_h_kawin INT AUTO_INCREMENT,
    id_company INT NOT NULL,
    id_user INT NOT NULL,
    animal_fem INT NOT NULL,
    animal_male INT NOT NULL,
    PRIMARY KEY (id_h_kawin),
    KEY animal_fem (animal_fem),
    KEY animal_male (animal_male),
    KEY id_user (id_user),
    KEY id_company (id_company),
    FOREIGN KEY (id_company) REFERENCES Company(id_company),
    FOREIGN KEY (animal_fem) REFERENCES Animal(id_animal),
    FOREIGN KEY (animal_male) REFERENCES Animal(id_animal),
    FOREIGN KEY (id_user) REFERENCES User(id_user)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

--
-- Table structure for table `D_kawin`
--

CREATE TABLE D_kawin (
    id_d_kawin INT AUTO_INCREMENT,
    id_h_kawin INT NOT NULL,
    kawin_status INT NOT NULL, -- berhasil / gagal
    kawin_timestamp timestamp NOT NULL,
    PRIMARY KEY (id_d_kawin),
    KEY id_h_kawin (id_h_kawin),
    FOREIGN KEY (id_h_kawin) REFERENCES H_kawin(id_h_kawin)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;