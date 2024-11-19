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

variable "demo_account_id" {
  type    = string
  default = "762233751904"
}

variable "DB_CONNECTION_URL" {
  type      = string
  default   = ""
  sensitive = true
}

variable "SERVER_HOSTNAME" {
  type      = string
  default   = ""
  sensitive = true
}

variable "SERVER_PORT_NUMBER" {
  type      = string
  default   = ""
  sensitive = true
}

variable "DB_NAME" {
  type      = string
  default   = ""
  sensitive = true
}

variable "DB_USERNAME" {
  type      = string
  default   = ""
  sensitive = true
}

variable "DB_PASSWORD" {
  type      = string
  default   = ""
  sensitive = true
}

variable "RUNNER_AWS_KEY" {
  type      = string
  default   = ""
  sensitive = true
}


variable "RUNNER_AWS_SECRET" {
  type      = string
  default   = ""
  sensitive = true
}


source "amazon-ebs" "CSYE6225-04" {
  ami_name = "csye6225-Assignment-004_${formatdate("YYYY_MM_DD", timestamp())}"

  access_key = "${var.RUNNER_AWS_KEY}"

  secret_key = "${var.RUNNER_AWS_SECRET}"

  instance_type = "t2.2xlarge"

  region = "${var.aws_region}"

  ami_regions = [
    "${var.aws_region}"
  ]

  ami_description = "Assignment 04 AMI - CSYE 6225"

  ami_users = [
    var.demo_account_id,
  ]

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

  post-processor "manifest" {
    output     = "manifest.json"
    strip_path = true
  }


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
      "CEHCKPOINT_DISABLE=1",
    ]

    inline = [
      # apt upgrade
      "export DEBIAN_FRONTEND=noninteractive",
      "sudo apt-get update",
      "sudo apt-get upgrade -y",
      "sudo apt install unzip",

      #user creation
      "sudo groupadd csye6225",
      "sudo useradd -g csye6225 -s /usr/sbin/nologin csye6225",

      #Move files
      "sudo mv /tmp/webapp.zip /opt/",
      "sudo chmod -R 777 /opt/webapp.zip",
      "sudo unzip /opt/webapp.zip -d /opt/webapp",
      "sudo ls -al /opt",
      "sudo mv /tmp/run_webapp.sh /opt/",
      "sudo mv /tmp/csye6225.service /etc/systemd/system/",

      #Chown for csye6225
      "sudo chown -R csye6225:csye6225 /opt/webapp",


      #Run shell script for setting up DB and unzipping application
      "sudo bash /opt/run_webapp.sh ${var.DB_USERNAME} ${var.DB_PASSWORD} ${var.DB_NAME}",

      # Run systemctl services for the app
      "sudo systemctl daemon-reload",
      # "sudo systemctl start csye6225.service",
      "sudo systemctl enable csye6225.service",

      #Remove git
      "sudo apt-get remove git -y",

      # install yum
      "sudo wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb",
      "sudo dpkg -i -E ./amazon-cloudwatch-agent.deb",
      "sudo apt-get update && sudo apt-get install collectd -y",
      "sudo apt-get clean",
    ]
  }

}