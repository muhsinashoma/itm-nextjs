-- MySQL dump 10.13  Distrib 8.4.8, for Linux (x86_64)
--
-- Host: localhost    Database: itm
-- ------------------------------------------------------
-- Server version	5.5.62-0ubuntu0.14.04.1-log


--
-- Table structure for table `admin_user_info`
--



CREATE TABLE `admin_user_info` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(35) DEFAULT NULL,
  `password` varchar(64) DEFAULT NULL,
  `employee_id` varchar(35) DEFAULT NULL,
  `full_name` varchar(30) DEFAULT NULL,
  `email` varchar(50) DEFAULT NULL,
  `mobile` varchar(15) DEFAULT NULL,
  `user_type` tinyint(5) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `user` varchar(64) DEFAULT NULL,
  `salt` varchar(64) DEFAULT '99d30090c8a2247f022032e630de6733',
  `otp_verify` tinyint(2) DEFAULT '0',
  PRIMARY KEY (`id`),
  UNIQUE KEY `user_name` (`user_name`)
) ENGINE=InnoDB AUTO_INCREMENT=2232 DEFAULT CHARSET=utf8;




--
-- Table structure for table `ibl_it_usages_parts_category_list`
--

CREATE TABLE `ibl_it_usages_parts_category_list` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `usages_parts_category` varchar(100) DEFAULT NULL,
  `status` int(2) DEFAULT '1',
  `created_by` varchar(12) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `edited_by` varchar(12) DEFAULT NULL,
  `edited_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=53 DEFAULT CHARSET=latin1;



--
-- Table structure for table `tbl_device_claim`
--


CREATE TABLE `tbl_device_claim` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `reference_no_claim` int(10) NOT NULL,
  `category` varchar(60) NOT NULL,
  `brand` varchar(70) NOT NULL,
  `model_no` varchar(70) NOT NULL,
  `attach_file` varchar(128) DEFAULT NULL,
  `device_sl_no` varchar(100) NOT NULL,
  `claim_status` int(4) NOT NULL,
  `previous_status` int(2) NOT NULL,
  `vendor` int(100) NOT NULL,
  `remarks` tinytext,
  `problems` tinytext NOT NULL,
  `designated_email_to` varchar(150) NOT NULL,
  `designated_email_cc` varchar(200) NOT NULL,
  `vendor_receiver` varchar(100) NOT NULL,
  `vndr_receiver_mobile` varchar(16) NOT NULL,
  `received_date` datetime NOT NULL,
  `received_by` varchar(10) NOT NULL,
  `gate_pass_date` datetime NOT NULL,
  `unit` int(5) NOT NULL,
  `quantity` int(5) NOT NULL,
  `return_issue` tinytext NOT NULL,
  `return_date` datetime NOT NULL,
  `return_by_it_person` varchar(10) NOT NULL,
  `gate_pass_remarks` tinytext NOT NULL,
  `created_by` varchar(15) NOT NULL,
  `created_at` datetime NOT NULL,
  `edited_by` varchar(15) NOT NULL,
  `edited_at` datetime NOT NULL,
  `status` int(3) NOT NULL DEFAULT '1',
  `tbl_it_inventory_device_id` int(11) NOT NULL,
  `service_type` int(2) NOT NULL DEFAULT '0',
  `approved_val` int(2) NOT NULL DEFAULT '0',
  `approved_by` varchar(10) DEFAULT NULL,
  `approved_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=153 DEFAULT CHARSET=latin1;



--
-- Table structure for table `tbl_device_clamin_history`
--

CREATE TABLE `tbl_device_clamin_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `reference_no_claim` int(10) NOT NULL,
  `device_sl_no` varchar(100) NOT NULL,
  `user_id_forward` varchar(45) NOT NULL,
  `user_id_received` varchar(45) NOT NULL,
  `previos_status` int(2) NOT NULL,
  `current_status` int(2) NOT NULL,
  `remarks_all_status` tinytext NOT NULL,
  `vendor_representor` varchar(100) NOT NULL,
  `created_by` varchar(15) NOT NULL,
  `create_at` datetime NOT NULL,
  `status` int(2) NOT NULL DEFAULT '1',
  `vendor_personnel_name` varchar(100) NOT NULL,
  `vendor_mobile` varchar(16) NOT NULL,
  `attach_file` varchar(128) DEFAULT NULL,
  `tbl_it_inventory_device_id` int(11) NOT NULL,
  `service_type` int(2) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=432 DEFAULT CHARSET=latin1;




--
-- Table structure for table `tbl_device_ownership_transfer_form`
--

CREATE TABLE `tbl_device_ownership_transfer_form` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(10) DEFAULT NULL,
  `deducted_amount` bigint(20) DEFAULT NULL,
  `device_age` text,
  `sepecification` text,
  `receiver_id` varchar(10) DEFAULT NULL,
  `gate_pass_date` date DEFAULT NULL,
  `item_name` varchar(100) DEFAULT NULL,
  `item_description` tinytext,
  `unit` text,
  `quantity` int(11) DEFAULT NULL,
  `device_sl_no` varchar(100) DEFAULT NULL,
  `remarks` text,
  `created_by` varchar(10) DEFAULT NULL,
  `created_at` datetime DEFAULT NULL,
  `edited_by` varchar(10) DEFAULT NULL,
  `edited_at` datetime DEFAULT NULL,
  `status` int(2) DEFAULT '1',
  `company_material` int(2) DEFAULT NULL,
  `non_refundable` int(2) DEFAULT NULL,
  `receiver_address` varchar(100) DEFAULT NULL,
  `device_assigned_id` int(11) NOT NULL,
  `owst_category` tinyint(2) DEFAULT NULL,
  `vendor_name` varchar(200) DEFAULT NULL,
  `vendor_address` varchar(200) DEFAULT NULL,
  `vendor_mobile` varchar(16) DEFAULT NULL,
  `vendor_deducted_amount` int(11) DEFAULT NULL,
  `vendor_others` tinytext,
  `attach_file` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=186 DEFAULT CHARSET=latin1;




--
-- Table structure for table `tbl_device_ownership_vendor_list`
--


CREATE TABLE `tbl_device_ownership_vendor_list` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `owst_vendor_name` varchar(150) NOT NULL,
  `vendor_address` varchar(200) NOT NULL,
  `vendor_mobile` varchar(11) NOT NULL,
  `vendor_deducted_amount` int(255) NOT NULL,
  `vendor_others` varchar(255) DEFAULT NULL,
  `device_assigned_id` int(255) NOT NULL,
  `created_by` varchar(15) NOT NULL,
  `created_at` datetime NOT NULL,
  `edited_by` varchar(45) NOT NULL,
  `edited_at` datetime NOT NULL,
  `status` int(2) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `vendor_name_UNIQUE` (`owst_vendor_name`)
) ENGINE=InnoDB AUTO_INCREMENT=6 DEFAULT CHARSET=latin1;




--
-- Table structure for table `tbl_device_warrenty_vendor_list`
--


CREATE TABLE `tbl_device_warrenty_vendor_list` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `vendor_name` varchar(150) NOT NULL,
  `vendor_address` varchar(200) NOT NULL,
  `vendor_mobile` varchar(11) NOT NULL,
  `vendor_others` varchar(255) DEFAULT NULL,
  `vendor_email` varchar(200) DEFAULT NULL,
  `created_by` varchar(15) NOT NULL,
  `created_at` datetime NOT NULL,
  `edited_by` varchar(45) NOT NULL,
  `edited_at` datetime NOT NULL,
  `status` int(2) NOT NULL DEFAULT '1',
  PRIMARY KEY (`id`),
  UNIQUE KEY `vendor_name_UNIQUE` (`vendor_name`)
) ENGINE=InnoDB AUTO_INCREMENT=14 DEFAULT CHARSET=latin1;




--
-- Table structure for table `tbl_emails`
--


CREATE TABLE `tbl_emails` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `from` varchar(50) DEFAULT NULL,
  `from_name` varchar(50) DEFAULT NULL,
  `to` varchar(50) DEFAULT NULL,
  `to_name` varchar(50) DEFAULT NULL,
  `cc` varchar(200) DEFAULT NULL,
  `subject` varchar(200) DEFAULT NULL,
  `body` text,
  `mail_status` varchar(12) DEFAULT NULL,
  `created_at` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `session_user` varchar(10) DEFAULT NULL,
  `session_ip` varchar(50) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=MyISAM AUTO_INCREMENT=32493 DEFAULT CHARSET=latin1;


--
-- Table structure for table `tbl_fault_type1`
--

CREATE TABLE `tbl_fault_type1` (
  `id` int(15) NOT NULL AUTO_INCREMENT,
  `fault_name` varchar(255) NOT NULL,
  `fault_register` varchar(128) NOT NULL,
  `fault_desc` text NOT NULL,
  `date` date DEFAULT NULL,
  `status` tinyint(2) DEFAULT '1',
  `edited_by` varchar(16) DEFAULT NULL,
  `edited_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=130 DEFAULT CHARSET=utf8;




--
-- Table structure for table `tbl_fault_type_other`
--


CREATE TABLE `tbl_fault_type_other` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `fault_name` varchar(128) DEFAULT NULL,
  `user` varchar(32) DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `tt_no` varchar(32) DEFAULT NULL,
  `status` tinyint(4) DEFAULT '1',
  `edit_by` varchar(32) DEFAULT NULL,
  `edit_date` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3213 DEFAULT CHARSET=latin1;




--
-- Table structure for table `tbl_history_table_it_equipment`
--

CREATE TABLE `tbl_history_table_it_equipment` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_id` varchar(12) NOT NULL,
  `table_name` varchar(50) NOT NULL,
  `tbl_pid` int(11) NOT NULL,
  `action` varchar(10) NOT NULL,
  `details` longtext NOT NULL,
  `created_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=latin1;



--
-- Table structure for table `tbl_inventory_category`
--

CREATE TABLE `tbl_inventory_category` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `inventory_category_list` varchar(100) DEFAULT NULL,
  `status` int(2) DEFAULT '1',
  `created_by` varchar(20) DEFAULT 'null',
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `edited_by` varchar(12) DEFAULT 'null',
  `edited_at` timestamp NULL DEFAULT '0000-00-00 00:00:00',
  `parent_id` int(5) DEFAULT '0',
  `type` varchar(100) DEFAULT NULL,
  `sub_parent_id` int(5) DEFAULT '0',
  `modified_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=234 DEFAULT CHARSET=latin1;


--
-- Table structure for table `tbl_inventory_damage`
--

CREATE TABLE `tbl_inventory_damage` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `department` varchar(20) NOT NULL,
  `function` varchar(20) NOT NULL,
  `device_category` varchar(50) NOT NULL,
  `device_status` int(2) NOT NULL DEFAULT '0',
  `device_sl_no` varchar(100) NOT NULL,
  `model` varchar(50) NOT NULL,
  `remarks` tinytext NOT NULL,
  `created_by` varchar(10) NOT NULL,
  `created_at` datetime NOT NULL,
  `updated_by` varchar(10) DEFAULT NULL,
  `updated_at` datetime DEFAULT NULL,
  `status` int(2) NOT NULL DEFAULT '1',
  `previous_status` int(2) NOT NULL DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=266 DEFAULT CHARSET=utf8mb4;



--
-- Table structure for table `tbl_it_equipment_request_stack_inventory`
--


CREATE TABLE `tbl_it_equipment_request_stack_inventory` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `stack_category` varchar(100) NOT NULL,
  `stack_type` varchar(10) NOT NULL,
  `status` int(2) DEFAULT '1',
  `created_by` varchar(10) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `edited_by` varchar(10) DEFAULT NULL,
  `edited_at` timestamp NULL DEFAULT NULL,
  `parent_id` int(5) DEFAULT '0',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=49 DEFAULT CHARSET=latin1;




--
-- Table structure for table `tbl_it_equipment_requisition_form`
--

CREATE TABLE `tbl_it_equipment_requisition_form` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `emp_id` varchar(10) NOT NULL,
  `emp_name` varchar(100) NOT NULL,
  `department` varchar(100) NOT NULL,
  `designation` varchar(50) NOT NULL,
  `category` varchar(50) NOT NULL,
  `brand` varchar(50) NOT NULL,
  `device_s_or_n` varchar(100) NOT NULL,
  `model_no` varchar(50) NOT NULL,
  `ip_address` varchar(50) NOT NULL,
  `lan_mac_address` varchar(100) NOT NULL,
  `wan_mac_address` varchar(100) NOT NULL,
  `hdd` varchar(50) NOT NULL,
  `ram` varchar(50) NOT NULL,
  `cpu` varchar(50) NOT NULL,
  `removal_drive` varchar(50) NOT NULL,
  `monitor` varchar(50) NOT NULL,
  `agp` varchar(50) NOT NULL,
  `lan` varchar(50) NOT NULL,
  `wan` varchar(50) NOT NULL,
  `ups_or_adapter` varchar(50) NOT NULL,
  `battary_or_monitor` varchar(50) NOT NULL,
  `os` varchar(128) NOT NULL,
  `remarks` text NOT NULL,
  `status` varchar(100) NOT NULL,
  `sl` varchar(20) DEFAULT NULL,
  `user_name` varchar(100) NOT NULL,
  `date` datetime NOT NULL,
  `adapter` varchar(255) DEFAULT NULL,
  `transfer_by` varchar(32) DEFAULT NULL,
  `transfer_date_time` datetime DEFAULT NULL,
  `assign_date` datetime DEFAULT NULL,
  `pr_number` varchar(32) DEFAULT NULL,
  `delete_by` varchar(32) DEFAULT NULL,
  `delete_date_time` datetime DEFAULT NULL,
  `delete_reason` text,
  `update_by` varchar(64) DEFAULT NULL,
  `update_date` datetime DEFAULT NULL,
  `vendor` varchar(150) DEFAULT NULL,
  `return_due` varchar(200) DEFAULT NULL,
  `return_by` varchar(20) DEFAULT NULL,
  `return_date` date DEFAULT NULL,
  `return_input_date` timestamp NULL DEFAULT CURRENT_TIMESTAMP,
  `bag` varchar(45) DEFAULT NULL,
  `mouse` varchar(45) DEFAULT NULL,
  `active` tinyint(2) NOT NULL DEFAULT '1',
  `return_status` tinyint(2) NOT NULL DEFAULT '0',
  `transfer_status` tinyint(2) NOT NULL DEFAULT '0',
  `tbl_it_equipment_new_id` varchar(11) NOT NULL DEFAULT '0',
  `device_type` int(2) DEFAULT '0',
  `previous_status` int(2) DEFAULT '0',
  `device_warranty_date` datetime NOT NULL,
  `os_key` varchar(64) DEFAULT NULL,
  `tt_reason_id` int(11) NOT NULL,
  `tt_no` varchar(20) NOT NULL,
  `dev_assigned_val` tinyint(2) NOT NULL,
  `mr_number` varchar(100) DEFAULT NULL,
  `stock_status` int(2) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=14747 DEFAULT CHARSET=latin1;




--
-- Table structure for table `tbl_it_equipment_requisition_stack_info`
--


CREATE TABLE `tbl_it_equipment_requisition_stack_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(10) NOT NULL,
  `mr_id` varchar(100) NOT NULL,
  `pr_id` varchar(100) DEFAULT NULL,
  `vendor_name` varchar(100) DEFAULT NULL,
  `serial_no` varchar(70) DEFAULT NULL,
  `purchase_date` datetime DEFAULT NULL,
  `category` varchar(50) DEFAULT NULL,
  `brand` varchar(50) DEFAULT NULL,
  `model` varchar(100) DEFAULT NULL,
  `cpu` varchar(100) DEFAULT NULL,
  `ram` varchar(100) DEFAULT NULL,
  `ssd` varchar(100) DEFAULT NULL,
  `monitor` varchar(100) DEFAULT NULL,
  `warranty_date` datetime NOT NULL,
  `item_group` varchar(100) DEFAULT NULL,
  `item_name` varchar(100) DEFAULT NULL,
  `gr_id` varchar(100) DEFAULT NULL,
  `total_item` int(11) DEFAULT '0',
  `remarks` text,
  `status` int(11) NOT NULL DEFAULT '1',
  `created_at` datetime NOT NULL,
  `edited_by` varchar(10) DEFAULT NULL,
  `edited_at` datetime DEFAULT NULL,
  `device_assigned_status` int(2) DEFAULT '0',
  `refno_tbl_it_equipment_requisition` varchar(255) DEFAULT NULL,
  `device_assiged_date` datetime DEFAULT NULL,
  `device_assiged_by` varchar(10) DEFAULT NULL,
  `device_type` varchar(45) DEFAULT NULL,
  `inventory_type` varchar(45) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=487 DEFAULT CHARSET=latin1;



--
-- Table structure for table `tbl_it_equipment_status_history`
--

DROP TABLE IF EXISTS `tbl_it_equipment_status_history`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!50503 SET character_set_client = utf8mb4 */;
CREATE TABLE `tbl_it_equipment_status_history` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `tbl_it_equipment_id` int(255) NOT NULL,
  `device_s_or_n` varchar(100) NOT NULL,
  `user_id_return` varchar(10) NOT NULL,
  `user_id_transfer` varchar(10) NOT NULL,
  `previos_status` int(2) NOT NULL,
  `current_status` int(2) NOT NULL,
  `change_by` varchar(10) NOT NULL,
  `change_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `return_comment` varchar(255) DEFAULT NULL,
  `transfer_comment` varchar(255) DEFAULT NULL,
  `tbl_it_equipment_new_id` int(255) NOT NULL,
  `active` varchar(3) NOT NULL DEFAULT 'yes',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3630 DEFAULT CHARSET=latin1;





--
-- Table structure for table `tbl_it_inventory_device_form`
--


CREATE TABLE `tbl_it_inventory_device_form` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(10) DEFAULT NULL,
  `category` int(10) DEFAULT NULL,
  `device_name` varchar(100) DEFAULT NULL,
  `brand` varchar(80) DEFAULT NULL,
  `model` varchar(80) DEFAULT NULL,
  `serial` varchar(80) DEFAULT NULL,
  `uses_location` varchar(100) DEFAULT NULL,
  `assign_date` date DEFAULT NULL,
  `it_personel` varchar(100) DEFAULT NULL,
  `details` text,
  `created_by` varchar(12) DEFAULT NULL,
  `created_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `edited_by` varchar(12) DEFAULT NULL,
  `edited_at` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `status` int(2) DEFAULT '1',
  `pr_number` varchar(100) NOT NULL,
  `vendor_name` varchar(100) NOT NULL,
  `purchase_date` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `warranty_date_month` varchar(100) NOT NULL,
  `warranty_date_month_backup` int(6) NOT NULL,
  `remarks` tinytext NOT NULL,
  `claimed_by` varchar(20) NOT NULL,
  `claimed_date` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `claim_status` tinyint(2) NOT NULL,
  `previous_status` tinyint(2) NOT NULL,
  `accessories_category` int(10) NOT NULL,
  `mr_number` varchar(100) NOT NULL,
  `type` varchar(20) NOT NULL DEFAULT 'IT Accessories',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=94 DEFAULT CHARSET=latin1;


--
-- Table structure for table `tbl_login_backgound_image`
--


CREATE TABLE `tbl_login_backgound_image` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `attach_file` varchar(128) NOT NULL,
  `employee_id` varchar(45) NOT NULL,
  `created_at` datetime NOT NULL,
  `status` int(2) NOT NULL DEFAULT '1',
  `edited_by` varchar(45) DEFAULT NULL,
  `edited_at` datetime NOT NULL,
  `user` varchar(45) DEFAULT NULL,
  `commet` varchar(255) NOT NULL,
  `attach_file1` varchar(128) DEFAULT NULL,
  `images` varchar(256) DEFAULT NULL,
  `priority` int(2) NOT NULL,
  `category` int(3) NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=7 DEFAULT CHARSET=latin1;




--
-- Table structure for table `tbl_login_log`
--

CREATE TABLE `tbl_login_log` (
  `logid` int(11) NOT NULL AUTO_INCREMENT,
  `login_id` varchar(20) DEFAULT NULL,
  `logout_time` datetime NOT NULL,
  `log_date` date DEFAULT NULL,
  `login_time` timestamp NOT NULL DEFAULT '0000-00-00 00:00:00',
  `ip_address` varchar(20) DEFAULT NULL,
  `user_type` int(11) DEFAULT '0',
  `mac` varchar(128) DEFAULT NULL,
  PRIMARY KEY (`logid`)
) ENGINE=InnoDB AUTO_INCREMENT=59308 DEFAULT CHARSET=latin1;



--
-- Table structure for table `tbl_office_info`
--


CREATE TABLE `tbl_office_info` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `emp_id` int(12) NOT NULL,
  `designation` varchar(50) NOT NULL,
  `work_field` varchar(50) NOT NULL,
  `department_name` varchar(50) NOT NULL,
  `active` varchar(25) NOT NULL,
  `separation_mode` varchar(25) NOT NULL,
  `separation_date` varchar(50) NOT NULL,
  `joining_date` varchar(50) NOT NULL,
  `provision_period` varchar(50) NOT NULL,
  `confirmation_date` varchar(50) NOT NULL,
  `posting_district` varchar(50) NOT NULL,
  `area_of_posting` varchar(85) NOT NULL,
  `last_posting` varchar(50) NOT NULL,
  `promotion_status` varchar(25) NOT NULL,
  `medical_test_status` varchar(25) NOT NULL,
  `performance_rating` varchar(50) NOT NULL,
  `transport_facilities` varchar(50) NOT NULL,
  `increment_status` varchar(35) NOT NULL,
  `input_by` varchar(25) NOT NULL,
  `date` date NOT NULL,
  `change_date` varchar(50) DEFAULT NULL,
  `emp_status` tinyint(4) NOT NULL DEFAULT '1',
  `employee_type` varchar(64) NOT NULL,
  `level` tinyint(2) NOT NULL,
  `employee_id` varchar(24) DEFAULT NULL,
  `employee_name` varchar(64) DEFAULT NULL,
  `elg_status` tinyint(4) DEFAULT NULL,
  `elg_status1` tinyint(4) DEFAULT NULL,
  `job_rule` varchar(32) DEFAULT NULL,
  `sub_function` varchar(64) DEFAULT NULL,
  `co_name` varchar(128) DEFAULT NULL,
  `zoneId` int(11) DEFAULT NULL,
  `regionId` int(11) DEFAULT NULL,
  `dept_short_name` varchar(8) DEFAULT NULL,
  `mbr_level` varchar(150) DEFAULT NULL,
  `contract_type` tinyint(4) DEFAULT '1',
  `mbr_level_numeric` int(11) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `emp_id` (`emp_id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  KEY `active` (`active`)
) ENGINE=InnoDB AUTO_INCREMENT=2856 DEFAULT CHARSET=utf8;


--
-- Table structure for table `tbl_personal_info`
--

CREATE TABLE `tbl_personal_info` (
  `id` int(12) NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(50) NOT NULL,
  `employee_name` varchar(80) NOT NULL,
  `fathers_name` varchar(80) NOT NULL,
  `mothers_name` varchar(85) NOT NULL,
  `national_id` varchar(80) NOT NULL,
  `blood_group` varchar(25) NOT NULL,
  `religion` varchar(30) NOT NULL,
  `date_of_birth` varchar(50) NOT NULL,
  `gender` varchar(50) NOT NULL,
  `marital_status` varchar(30) NOT NULL,
  `record_of_police_case` varchar(50) NOT NULL,
  `reason_of_police_case` varchar(85) NOT NULL,
  `employed_through` varchar(85) NOT NULL,
  `personal_cell_no` varchar(20) NOT NULL,
  `official_cell_no` varchar(20) NOT NULL,
  `official_land_phone_no` varchar(20) NOT NULL,
  `email` varchar(50) NOT NULL,
  `official_email` varchar(50) NOT NULL,
  `present_address` text NOT NULL,
  `postal_code_1` int(25) NOT NULL,
  `police_station_1` varchar(50) NOT NULL,
  `city_1` varchar(50) NOT NULL,
  `country_1` varchar(50) NOT NULL,
  `permanent_address` text NOT NULL,
  `postal_code_2` int(12) NOT NULL,
  `police_station_2` varchar(50) NOT NULL,
  `city_2` varchar(50) NOT NULL,
  `country_2` varchar(50) NOT NULL,
  `picture` varchar(50) NOT NULL,
  `input_by` varchar(25) NOT NULL,
  `date` date NOT NULL,
  PRIMARY KEY (`id`),
  KEY `employee_id` (`employee_id`),
  KEY `employee_name` (`employee_name`)
) ENGINE=InnoDB AUTO_INCREMENT=2895 DEFAULT CHARSET=utf8;


--
-- Table structure for table `tbl_tier`
--


CREATE TABLE `tbl_tier` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `employee_id` varchar(20) DEFAULT NULL,
  `tr1` varchar(20) DEFAULT NULL,
  `tr2` varchar(20) DEFAULT NULL,
  `tr3` varchar(20) DEFAULT NULL,
  `tr4` varchar(20) DEFAULT NULL,
  `tr5` varchar(20) DEFAULT NULL,
  `status` varchar(15) NOT NULL,
  `user` varchar(64) DEFAULT NULL,
  `date` varchar(64) DEFAULT NULL,
  `active` varchar(12) DEFAULT NULL,
  `level` tinyint(4) DEFAULT NULL,
  `deligation` varchar(8) DEFAULT NULL,
  `kpi_eligible` int(1) DEFAULT '0',
  `job_completion_eligible` int(1) DEFAULT '0',
  `attendance_status` int(1) DEFAULT '0',
  `tr6` varchar(20) DEFAULT NULL,
  `eportal_eligibility` varchar(20) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `employee_id` (`employee_id`),
  KEY `tr1` (`tr1`),
  KEY `tr4` (`tr4`),
  KEY `tr5` (`tr5`),
  KEY `active` (`active`)
) ENGINE=MyISAM AUTO_INCREMENT=3816 DEFAULT CHARSET=latin1;


--
-- Table structure for table `tbl_track_tt`
--

CREATE TABLE `tbl_track_tt` (
  `id` int(15) NOT NULL AUTO_INCREMENT,
  `tt_no` double NOT NULL,
  `create_date` date NOT NULL,
  `date` datetime NOT NULL,
  `mail_to` varchar(128) DEFAULT NULL,
  `mail_cc` varchar(512) DEFAULT NULL,
  PRIMARY KEY (`id`),
  UNIQUE KEY `tt_no` (`tt_no`)
) ENGINE=InnoDB AUTO_INCREMENT=29326 DEFAULT CHARSET=utf8;




--
-- Table structure for table `tbl_trouble_input`
--


CREATE TABLE `tbl_trouble_input` (
  `id` int(15) NOT NULL AUTO_INCREMENT,
  `tt_no` double NOT NULL,
  `fault_date_time` datetime NOT NULL,
  `client_name` varchar(30) NOT NULL,
  `client_impl_id` int(15) NOT NULL,
  `client_fault_type` int(4) NOT NULL,
  `fault_requested_by` varchar(30) DEFAULT NULL,
  `fault_registered_at_cc` varchar(30) DEFAULT NULL,
  `fault_forwarded_to` varchar(255) DEFAULT NULL,
  `dept_person_name` varchar(30) DEFAULT NULL,
  `reason_of_problem` varchar(1024) DEFAULT NULL,
  `date` date DEFAULT NULL,
  `status` tinyint(1) DEFAULT '1',
  `fault_forward_logical` varchar(255) DEFAULT NULL,
  `forward_logical_person` varchar(128) DEFAULT NULL,
  `from_zone` varchar(128) DEFAULT NULL,
  `to_zone` varchar(128) DEFAULT NULL,
  `problem_owner` varchar(255) DEFAULT NULL,
  `ring_chain` tinyint(1) DEFAULT '1',
  `down_time` datetime DEFAULT NULL,
  `restoration_date_time` datetime DEFAULT NULL,
  `fft_third_party` varchar(256) DEFAULT NULL,
  `route_cause` varchar(255) DEFAULT NULL,
  `user` varchar(128) DEFAULT NULL,
  `close_ticket_by` varchar(128) DEFAULT NULL,
  `ticket_close_date` datetime DEFAULT NULL,
  `closing_description` blob,
  `client_from_address` varchar(512) DEFAULT NULL,
  `client_to_address` varchar(512) DEFAULT NULL,
  `link_type` varchar(256) DEFAULT NULL,
  `from_site_id` varchar(512) DEFAULT NULL,
  `to_site_id` varchar(512) DEFAULT NULL,
  `tt_close_time` datetime DEFAULT NULL,
  `core_capacity` varchar(128) DEFAULT NULL,
  `employee_id` varchar(32) DEFAULT NULL,
  `designation` varchar(128) DEFAULT NULL,
  `depertment` varchar(128) DEFAULT NULL,
  `phone` varchar(16) DEFAULT NULL,
  `email` varchar(32) DEFAULT NULL,
  `cordination` varchar(64) DEFAULT NULL,
  `attach_file` varchar(128) DEFAULT NULL,
  `prev_fault` int(4) DEFAULT NULL,
  `device_requis_val` tinyint(2) NOT NULL,
  `requis_by` varchar(10) NOT NULL,
  `requis_date` datetime NOT NULL,
  `status_progess` tinyint(2) NOT NULL DEFAULT '2',
  `status_update_by` varchar(10) NOT NULL,
  `status_update_date` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `active` varchar(3) DEFAULT NULL,
  `delete_by` varchar(10) DEFAULT NULL,
  `delete_at` datetime DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=29165 DEFAULT CHARSET=utf8;




--
-- Table structure for table `tbl_tt_reason`
--

CREATE TABLE `tbl_tt_reason` (
  `id` int(10) NOT NULL AUTO_INCREMENT,
  `category` varchar(50) NOT NULL,
  `tt_no` varchar(15) NOT NULL,
  `employee_id` varchar(10) NOT NULL,
  `reason_details` tinytext NOT NULL,
  `status` int(2) NOT NULL DEFAULT '1',
  `created_by` varchar(10) NOT NULL,
  `created_at` datetime NOT NULL,
  `approved_val` int(2) NOT NULL,
  `approved_by` varchar(10) NOT NULL,
  `approved_date` datetime NOT NULL,
  `edited_by` varchar(10) NOT NULL,
  `edited_at` datetime NOT NULL,
  `device_sl_no` varchar(100) NOT NULL,
  `delivered_val` tinyint(2) NOT NULL,
  `delivered_by` varchar(10) NOT NULL,
  `delivered_date` datetime NOT NULL,
  `dev_assigned_val` tinyint(2) NOT NULL,
  `dev_assinged_by` varchar(10) NOT NULL,
  `dev_assigned_date` datetime NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=386 DEFAULT CHARSET=latin1;



--
-- Table structure for table `tbl_tt_update`
--


CREATE TABLE `tbl_tt_update` (
  `id` int(15) NOT NULL AUTO_INCREMENT,
  `tt_no` double NOT NULL,
  `client_name` varchar(255) NOT NULL,
  `client_scr_id` int(20) NOT NULL,
  `fault_start_date_time` datetime NOT NULL,
  `fault_update_date_time` datetime NOT NULL,
  `fault_registered_at_cc` varchar(30) NOT NULL,
  `fault_update_at_cc` varchar(30) NOT NULL,
  `client_fault_type` int(15) NOT NULL,
  `tt_note` text NOT NULL,
  `date` date NOT NULL,
  `cc_id` int(30) DEFAULT NULL,
  `status` tinyint(2) DEFAULT NULL,
  `client_fault_forward_to` varchar(128) DEFAULT NULL,
  `forward_parson` varchar(128) DEFAULT NULL,
  `fault_requested_by` varchar(128) DEFAULT NULL,
  `from_zone` varchar(255) DEFAULT NULL,
  `to_zone` varchar(255) DEFAULT NULL,
  `user` varchar(255) DEFAULT NULL,
  `logical_team` varchar(255) DEFAULT NULL,
  `logical_team_person` varchar(255) DEFAULT NULL,
  `required_access_time` datetime DEFAULT NULL,
  `getting_accesstime_time` datetime DEFAULT NULL,
  `department` varchar(128) DEFAULT NULL,
  `file_link` varchar(256) DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=17633 DEFAULT CHARSET=utf8;



--
-- Table structure for table `tbl_user_info`
--

CREATE TABLE `tbl_user_info` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `user_name` varchar(100) NOT NULL COMMENT 'SELECT * FROM admin_user_info AS tbl_user_info WHERE employee_id NOT IN (SELECT employee_id FROM tbl_user_info)',
  `password` varchar(100) NOT NULL,
  `employee_id` varchar(20) NOT NULL,
  `email` varchar(100) NOT NULL,
  `mobile` varchar(50) NOT NULL,
  `user_type` varchar(10) NOT NULL,
  `full_name` varchar(100) NOT NULL,
  `department` varchar(100) DEFAULT NULL,
  `work_area` varchar(100) DEFAULT NULL,
  `designation` varchar(100) DEFAULT NULL,
  `status` int(11) DEFAULT NULL,
  `user` varchar(100) DEFAULT NULL,
  `date` datetime DEFAULT NULL,
  `employee_name` varchar(255) DEFAULT NULL,
  `edit_date` datetime DEFAULT NULL,
  `edit_by` varchar(32) DEFAULT NULL,
  `active` varchar(16) DEFAULT NULL,
  `admin_user_info_id` int(11) DEFAULT '0',
  `salt` varchar(64) DEFAULT NULL,
  `otp_verify` varchar(4) DEFAULT NULL,
  `app_token` varchar(1024) DEFAULT NULL,
  `token_update_time` varchar(16) DEFAULT NULL,
  `inactive_by` varchar(16) DEFAULT NULL,
  `inactive_date` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=3110 DEFAULT CHARSET=latin1;



