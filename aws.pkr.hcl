packer {
  required_plugins {
    amazon = {
      version = ">= 1.2.8"
      source  = "github.com/hashicorp/amazon"
    }
  }
}

variable "aws_region" {
  type    = string
  default = "us-east-1"
}

variable "aws_subnet" {
  type    = string
  default = "subnet-0d9ed3b7a8baff716" // us-east-1A
}

variable "ssh_username" {
  type    = string
  default = "ubuntu"
}

variable "source_ami" {
  type    = string
  default = "ami-0866a3c8686eaeeba"
}

variable "DB_CONNECTION_URL" {
  type    = string
  default = ""
  sensitive = true
}

variable "SERVER_HOSTNAME" {
  type    = string
  default = ""
  sensitive = true
}

variable "SERVER_PORT_NUMBER" {
  type    = string
  default = ""
  sensitive = true
}

variable "DB_NAME" {
  type    = string
  default = ""
  sensitive = true
}

variable "DB_USERNAME" {
  type    = string
  default = ""
  sensitive = true
}

variable "DB_PASSWORD" {
  type    = string
  default = ""
  sensitive = true
}



source "amazon-ebs" "CSYE6225-04" {
  ami_name = "csye6225-Assignment-004_${formatdate("YYYY_MM_DD", timestamp())}"

  instance_type = "t2.small"

  region = "${var.aws_region}"

  ami_regions = [
    "${var.aws_region}"
  ]

  ami_description = "Assignment 04 AMI - CSYE 6225"

  source_ami = "${var.source_ami}"

  ssh_username = "${var.ssh_username}"

  subnet_id = "${var.aws_subnet}"

  aws_polling {
    delay_seconds = 100
    max_attempts  = 50
  }

  launch_block_device_mappings {
    delete_on_termination = true
    device_name           = "/dev/sda1"
    volume_size           = 25
    volume_type           = "gp2"
  }

}

build {
  sources = [
    "source.amazon-ebs.CSYE6225-04",
  ]

  provisioner "file" {
    source      = "csye6225.service"
    destination = "/tmp/"
  }

  provisioner "file" {
    source      = "webapp.zip"
    destination = "/tmp/"
  }

  provisioner "file" {
    source      = "run_webapp.sh"
    destination = "/tmp/"
  }


  provisioner "shell" {
    environment_vars = [
      "DEBIAN_FRONTEND=noninteractive",
      "CEHCKPOINT_DISABLE=1",
    ]

    inline = [
      # apt upgrade
      "sudo apt-get update",
      "sudo apt-get upgrade -y",

      #user creation
      "sudo groupadd csye6225",
      "sudo useradd -g csye6225 -s /usr/sbin/nologin csye6225",

      #Move files
      "sudo mv /tmp/webapp.zip /opt/",
      "sudo mv /tmp/run_webapp.sh /opt/",
      "sudo mv /tmp/csye6225.service /etc/systemd/system/",

      #unzip all required files
      
      
      #Run shell script for setting up DB and unzipping application
      "bash /opt/webapp/run_webapp.sh ${var.DB_USERNAME} ${var.DB_PASSWORD} ${var.DB_NAME}",

      "sudo apt-get clean",
    ]
  }
}