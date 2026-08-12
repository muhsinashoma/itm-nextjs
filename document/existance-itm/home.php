<?php include_once 'main_header.php'; ?>

<?php

$user_employee_id = $_SESSION['eID'];
$counters = $control->moduller()->homeContentCounts();

$counters['total_procurement_tt'];
$it_responsible_person = $control->ITResponsiblePerson();
$it_responsible_user = $control->ITResponsibleUser();

$total_requisition = $control->totalDeviceRequisition();
$total_requisition[0];


if (($_SESSION['user_type'] == 1) or ($_SESSION['user_type'] == 2 && $UserOfficeInfo[3] == 'IT')) {
    $statement1 = '';
} else {
    echo "<meta http-equiv='refresh' content='0;url=?e=pabx&p=all_list&f=all&l=home_user'>";
    die("<center style='font-size: larger; color: white'>Working...</center>");
}
$page = (int) (!isset($_GET["page"]) ? 1 : $_GET["page"]);
$limit = 1000;
$startPoint = ($page * $limit) - $limit;

if ($_GET['tt_no'] != "") {
    $statement .= " and tbl_trouble_input.tt_no like '%$_GET[tt_no]%'";
}
if ($_GET['forward_logical_person'] != "") {
    $client_name_rep = str_replace("+", " ", $_GET['forward_logical_person']);

    $statement .= " and tbl_trouble_input.forward_logical_person = '$client_name_rep'";
}
if ($_GET['employee_id'] != "") {
    $statement .= " and tbl_trouble_input.employee_id like '%$_GET[employee_id]%'";
}

if ($_GET['query_type'] != "") {
    $statement .= " and tbl_trouble_input.client_fault_type='$_GET[query_type]'";
}

if ($_GET['phone'] != "") {
    $statement .= " and tbl_trouble_input.phone like '%$_GET[phone]%'";
}
if ($_GET['status'] != "") {
    $statement .= " and tbl_trouble_input.status= $_GET[status]";
}

if ($_GET['depertment'] != "") {
    $statement .= " and tbl_trouble_input.depertment like '%$_GET[depertment]%'";
}


if ($_GET['it_personel'] != "") {
    $statement .= " and tbl_trouble_input.forward_logical_person='$_GET[it_personel]'";
}


if ($_GET['system_from'] != "" && $_GET['system_to'] != "") {
    $open_from = date('Y-m-d H:i:s', strtotime($_GET['system_from']));
    $open_to = date('Y-m-d H:i:s', strtotime($_GET['system_to']));
    $statement .= " and ((tbl_trouble_input.fault_date_time between '$open_from' and '$open_to') or (tbl_trouble_input.fault_date_time between '$open_from' and '$open_to'))";
}

$mod_statement = str_replace("'", "*", $statement);


if (isset($_POST['btnSearch'])) {

    $curUrl = $_SERVER[REQUEST_URI];
    $pageurl =  http_build_query($_POST);
    if (empty($_GET['search'])) {
        echo "<meta http-equiv='refresh' content='0;url=?e=pabx&p=all_list&f=all&l=home&search=1&$pageurl'>";
    } else {
        echo "<meta http-equiv='refresh' content='0;url=?e=pabx&p=all_list&f=all&l=home&search=&$pageurl'>";
    }
} elseif ($_GET['ccc_id'] != "") {
    $statement .= $_GET['ccc_id'];
} else {

    if ($_GET['tt_opened_toay'] == '1') {
        $today = date("Y-m-d");

        $statement .= " and date(tbl_trouble_input.fault_date_time) = '$today'";
    } elseif ($_GET['tt_closed_today'] == '2') {
        $today = date("Y-m-d");
        $statement .= " and ticket_close_date LIKE '$today%' AND status ='0'";
    } elseif ($_GET['total_running_tt'] == '3') {
        $today = date("Y-m-d");
        $statement .= " and device_requis_val NOT IN (1, 3) AND status ='1'";
        //$statement .= "and status ='1'";
    } elseif ($_GET['total_procurement_tt'] == '4') {
        $today = date("Y-m-d");
        $statement .= " and device_requis_val != '' AND status ='1'";
    } else
        $statement .= "";
}

$checkSuperStatus = $control->SupervisorStatus11($_SESSION['eID']);
$userInfo = $control->UserEmployeeInfo($_SESSION['eID']);

$tier_employee = $control->tier_name($userInfo[1]);
$tier1_employee = $control->tier1_name($tier_employee[2]);
$user_emp_id = $userInfo[1];
if ($user_emp_id == $tier_employee[1]) {
    $user_emp_id = $tier_employee[1];
} elseif ($user_emp_id == $tier_employee[2]) {
    $user_emp_id = $tier_employee[2];
} elseif ($user_emp_id == $tier_employee[3]) {
    $user_emp_id = $tier_employee[3];
} elseif ($user_emp_id == $tier_employee[4]) {
    $user_emp_id = $tier_employee[4];
} elseif ($user_emp_id == $tier_employee[5]) {
    $user_emp_id = $tier_employee[5];
} else {
    $user_emp_id = $userInfo[0];
}

//echo $statement;

if ($userDetails[4] == '1' or $userDetails[4] == '2') {
    $lists_tt = $control->all_tt_lists_dashboard($statement, $startPoint, $limit);
} else {
    $lists_tt = $control->all_tt_lists_dashboard_general($statement, $startPoint, $limit, $statement1, $user_emp_id, $tier_employee[1]);
}

$running_tt = $counters[2];
$no_of_page = ceil($running_tt / 10);
//print_r($counters);
?>

<!-- <style>
    #example1 thead th {
        position: sticky;
        top: 0;
        background-color: lightgrey;
        z-index: 1;
    }
</style> -->


<!-- Content Wrapper. Contains page content -->
<div class="content-wrapper">
    <!-- Content Header (Page header) -->
    <section class="content-header">
        <h1>
            Welcome to <strong>F@H</strong> ITM
            <small>Version 3.0</small>
        </h1>
        <ol class="breadcrumb">
            <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>
            <li class="active">DASHBOARD</li>
        </ol>
    </section>

    <!-- Main content -->
    <section class="content">
        <!-- Info boxes -->
        <div class="row">
            <div class="col-md-3 col-sm-6 col-xs-12">
                <div class="info-box">
                    <span class="info-box-icon bg-red"><i class="ion ion-ios-calendar-outline"></i></span>

                    <div class="info-box-content">
                        <span class="info-box-text">TT OPENED TODAY</span>
                        <span class="info-box-number"><a target="_blank" href="?e=pabx&p=all_list&f=all&l=home&tt_opened_toay=1"><?php echo $counters['total_open_tt']; ?></a></span>
                    </div>
                    <!-- /.info-box-content -->
                </div>
                <!-- /.info-box -->
            </div>
            <!-- /.col -->
            <div class="col-md-3 col-sm-6 col-xs-12">
                <div class="info-box">
                    <span class="info-box-icon bg-green"><i class="ion ion-clipboard"></i></span>
                    <div class="info-box-content">
                        <span class="info-box-text">TT CLOSED TODAY</span>
                        <span class="info-box-number"><a target="_blank" href="?e=pabx&p=all_list&f=all&l=home&tt_closed_today=2"><?php echo $counters['total_close_tt']; ?></a></span>

                    </div>
                    <!-- /.info-box-content -->
                </div>
                <!-- /.info-box -->
            </div>
            <!-- /.col -->

            <!-- fix for small devices only -->
            <div class="clearfix visible-sm-block"></div>


            <div class="col-md-3 col-sm-6 col-xs-12">
                <div class="info-box">
                    <span class="info-box-icon bg-yellow"><i class="ion ion-ios-bookmarks-outline"></i></span>
                    <div class="info-box-content">
                        <span class="info-box-text">TOTAL RUNNING TT</span>
                        <span class="info-box-number"><a target="_blank" href="?e=pabx&p=all_list&f=all&l=home&total_running_tt=3"><?php echo $counters['total_running_tt']; ?></a></span>

                    </div>

                </div>
            </div>

            <div class="col-md-3 col-sm-6 col-xs-12">
                <div class="info-box">
                    <span class="info-box-icon bg-aqua"><i class="ion ion-ios-people-outline"></i></span>

                    <div class="info-box-content">
                        <span class="info-box-text">TOTAL PROCURE TT</span>
                        <span class="info-box-number">
                            <span class="info-box-number"><a target="_blank" href="?e=pabx&p=all_list&f=all&l=home_total_procurement_tt"><?php echo $counters['total_procurement_tt']; ?></a></span>
                    </div>
                    <!-- /.info-box-content -->
                </div>
                <!-- /.info-box -->
            </div>

        </div>
        <!-- /.row -->
        <!-- /.row -->
        <!-- Main row -->
        <div class="row">
            <!-- Left col -->
            <div class="col-md-12">
                <!-- MAP & BOX PANE -->
                <!-- TABLE: LATEST ORDERS -->
                <div class="box box-info">
                    <div class="box-header with-border">
                        <?php
                        if ($_GET['tt_opened_toay'] == '1') {
                            echo "<h3 class='box-title' style='color:black'>Total Opended TT </h3>";
                        } elseif ($_GET['tt_closed_today'] == '2') {
                            echo "<h3 class='box-title' style='color:black'>Total Closed TT </h3>";
                        } elseif ($_GET['total_running_tt'] == '3') {
                            echo "<h3 class='box-title' style='color:black'>Total Running TT </h3>";
                        } elseif ($_GET['total_procurement_tt'] == '4') {
                            echo "<h3 class='box-title' style='color:black'>Total Procure TT </h3>";
                        } else {
                            echo "<h3 class='box-title' style='color:black'>All Tickets</h3>";
                        }
                        ?>
                        <!-- <h3 class="box-title">All Tickets</h3> -->
                        <div class="box-tools pull-right">
                            <button type="button" class="btn btn-box-tool" data-widget="collapse"><i class="fa fa-minus"></i>
                            </button>
                        </div>
                    </div>
                    <!-- /.box-header -->
                    <div class="box-body" style="font-size: smaller">
                        <form method="post" id="frm1" action="" autocomplete="off">
                            <div class="box-body ultra-small">
                                <div class="form-group col-sm-2">
                                    <label for="client_name">Employee Name</label>
                                    <input type="text" class="form-control input-sm" id="client_name" onkeyup="lookup(this.value);" onblur="fill();" name="client_name" placeholder="emp name to search">
                                    <label id="suggestions" style="display: none;">
                                        <label style="font-size: smaller; cursor: pointer; z-index: 10; position: absolute;">
                                            <div class="FontSmaller" id="autoSuggestionsList">&nbsp;</div>
                                        </label>
                                    </label>
                                </div>

                                <div class="form-group col-sm-2">
                                    <label for="employee_id">Employee ID</label>
                                    <input type="text" class="form-control input-sm" name="employee_id" id="employee_id" placeholder="emp ID to search">
                                </div>

                                <div class="form-group col-sm-2">
                                    <label for="tt_no">TT No.</label>
                                    <input type="text" class="form-control input-sm" name="tt_no" id="tt_no" placeholder="TT no to search">
                                </div>

                                <div class="form-group col-sm-2">
                                    <label for="query_type">Query Type</label>
                                    <select name="query_type" id="query_type" class="form-control input-sm">
                                        <option value="">-Select-</option>
                                        <?php
                                        $fault_type = $control->show_fault();
                                        foreach ($fault_type as $fault):
                                        ?>
                                            <option value="<?php echo $fault[0]; ?>"><?php echo $fault[1]; ?></option>
                                        <?php
                                        endforeach;
                                        ?>
                                    </select>
                                </div>

                                <div class="form-group col-sm-2">
                                    <label for="department">Department</label>
                                    <select name="depertment" id="department" class="form-control input-sm">
                                        <option value="">-Select-</option>
                                        <?php
                                        $department_info = $control->employee_department_list();
                                        foreach ($department_info as $di):
                                        ?>
                                            <option value="<?php echo $di[0]; ?>"><?php echo $di[0]; ?></option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>

                                <div class="form-group col-sm-2">
                                    <label for="designation">Designation</label>
                                    <select name="designation" id="designation" class="form-control input-sm">
                                        <option value="">-Select-</option>
                                        <?php
                                        $designation_info = $control->employee_designation_list();
                                        foreach ($designation_info as $di):
                                        ?>
                                            <option value="<?php echo $di[0]; ?>"><?php echo $di[0]; ?></option>
                                        <?php endforeach; ?>
                                    </select>
                                </div>

                                <div class="form-group col-sm-2">
                                    <label for="status">Status</label>
                                    <select name="status" id="status" class="form-control input-sm">
                                        <option value="">-Select-</option>
                                        <option value="1">Open</option>
                                        <option value="0">Closed</option>
                                    </select>
                                </div>

                                <div class="form-group col-sm-2">
                                    <label for="responsible_person">IT Responsible Person</label>
                                    <select name="forward_logical_person" id="it_personel" class="form-control">
                                        <option value="">-Select-</option>
                                        <?php
                                        foreach ($it_responsible_person  as $alt) :
                                        ?>
                                            <option value="<?php echo $alt['employee_id'] ?>"><?php echo $alt['employee_name'] ?></option>
                                        <?php
                                        endforeach;
                                        ?>

                                    </select>
                                </div>


                                <div class="form-group col-sm-2">
                                    <label for="demo7">From Date</label>
                                    <div class="input-group date">
                                        <div class="input-group-addon">
                                            <i class="fa fa-calendar"></i>
                                        </div>
                                        <input type="text" class="form-control input-sm" name="system_from" value="<?php if (isset($_POST['system_from'])) echo $_POST['system_from']; ?>" id="demo7" onclick="javascript:NewCssCal('demo7', 'yyyyMMdd', 'arrow', true, '24', true)" placeholder="From Date" />
                                    </div>
                                </div>

                                <div class="form-group col-sm-2">
                                    <label for="demo8">To Date</label>
                                    <div class="input-group date">
                                        <div class="input-group-addon">
                                            <i class="fa fa-calendar"></i>
                                        </div>
                                        <input type="text" class="form-control input-sm" name="system_to" value="<?php if (isset($_POST['system_to'])) echo $_POST['system_to']; ?>" id="demo8" onclick="javascript:NewCssCal('demo8', 'yyyyMMdd', 'arrow', true, '24', true)" placeholder="To Date">
                                    </div>
                                </div>

                                <div class="form-group col-sm-1">
                                    <br>
                                    <input type="submit" name="btnSearch" value="Search" class="btn btn-success btn-sm pull-left">
                                </div>

                            </div>
                        </form>
                    </div>

                    <div class="box-body">
                        <div class="table-responsive">
                            <?php if (count($lists_tt)) {
                            ?>
                                <!-- <div style="max-height: 900px; overflow-y: auto;"> -->
                                <table id="example1" class="table table-bordered table-striped dataTable" style="font-size: smaller">
                                    <thead style="background-color: lightgrey">
                                        <!-- <tr class="persist-header"> -->
                                        <tr>
                                            <th>SL</th>
                                            <th>TicketNo</th>
                                            <th>Employee Name & ID</th>
                                            <th>Phone Number</th>
                                            <th>Query Type</th>
                                            <th>Desig and Dept (Assigned)</th>
                                            <th>Desig and Dept (Current)</th>
                                            <th>TT Age</th>
                                            <th>Responsible Person</th>
                                            <th>Created By</th>
                                            <th>Closed By</th>
                                            <th>Attach File</th>
                                            <th>Status</th>
                                            <th>Requisition</th>
                                            <th>Delivered Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <?php
                                        $i = $startPoint + 1;

                                        foreach ($lists_tt as $tt) {
                                            $tbl_tt_update_last_info = $control->tbl_tt_update_last_info($tt[1]);
                                            $userInfoOfThisTT = $control->office_personal_info($tt[34]);
                                            $trouble_tt_id = $control->getDeviceApprovalDataTTPage($tt['tt_no']);
                                            echo "<tr><td>" . $i++ . "</td>";
                                            http: //192.168.1.132/ITM/?e=pabx&p=all_list&f=all&l=view_new_tt&cc_id=683&list_m=and%20tbl_trouble_input.status=1
                                            echo "<td><a href='?e=pabx&p=all_list&f=all&l=view_new_tt&cc_id=$tt[0]&list_m=$statement' >$tt[1]</a></td>";
                                            echo "<td><strong>$tt[3]</strong><br>$tt[34]</td>";
                                            echo "<td>$userInfoOfThisTT[official_cell_no]</td>";
                                            //echo "<td>$tt[3]</td>";
                                            echo "<td>";
                                            if ($tt[5] != '0') {
                                                $fault_type = $control->check_fault_type($tt[5]);
                                                echo $fault_type[1];
                                            } else {
                                                $other_fault_type = $control->other_fault_type($tt[1]);
                                                echo $other_fault_type[1];
                                            }
                                            echo "</td>";

                                            echo "<td><strong>$tt[35]</strong><br>$tt[36]</td>";

                                            echo "<td><strong>$userInfoOfThisTT[designation]</strong><br>$userInfoOfThisTT[department_name]</td>";

                                            if ($tt['status'] == 1) $now_date_time = date('Y-m-d H:i:s');
                                            else $now_date_time = date('Y-m-d H:i:s', strtotime($tt['ticket_close_date']));

                                            //$total_time = strtotime($now_date_time) - strtotime($tt[19]);
                                            $total_time = strtotime($now_date_time) - strtotime($tt[2]);
                                            $total1 = gmdate("H:i:s", $total_time);
                                            $total2 = gmdate("d", $total_time);
                                            $total_m = gmdate("m", $total_time) - 1;

                                            $total = $total2 - 1;
                                            echo "<td>" . $total_m . " Months " . $total . ' ' . 'Days' . ' <br>' . $total1 . ' ' . 'Hours' . "</td>";

                                            if ($tt[14] != '') {
                                                $emp_id = $tt[14];
                                            } else {
                                                $emp_id = $tbl_tt_update_last_info[9];
                                            }

                                            $Office_info = $control->UserOfficeInfo($emp_id);

                                            echo "<td>" . $Office_info[26] . "</td>";
                                            echo "<td>" . ucwords(str_replace(".", " ", $tt['user'])) . "</td>";
                                            echo "<td>" . $tt[24] . "</td>";

                                            if ($tt[40] != "") echo "<td><a href='$tt[40]'><button type='button' class='btn btn-primary btn-xs'>View File</button></a></td>";
                                            else echo "<td></td>";

                                            echo "<td>";
                                            echo $tt[12] ? "<span class='label label-danger'>Open" : "<span class='label label-success'>Closed";
                                            echo "</span></td>";

                                            echo "<td>";
                                            if ($trouble_tt_id['approved_val'] == '0') {
                                                echo "<span class='label label-default'>Raised</span>";
                                            } elseif ($trouble_tt_id['approved_val'] == '1') {
                                                echo "<span class='label label-success'>Petty Cash (Approved)</span>";
                                            } elseif ($trouble_tt_id['approved_val'] == '2') {
                                                echo "<span class='label label-warning'>Rejected</span>";
                                            } elseif ($trouble_tt_id['approved_val'] == '3') {
                                                echo "<span class='label label-info'>PR(Approved)</span>";
                                            }
                                            echo "</td>";

                                            echo "<td>";
                                            if ($trouble_tt_id['approved_val'] == '2' && $trouble_tt_id['delivered_val'] == '0') {
                                                echo "<span class='label label-warning'>Rejected </span>";
                                            } elseif ($trouble_tt_id['delivered_val'] == '0') {
                                                echo "<span class='label label-default'>Pending</span>";
                                            } elseif ($trouble_tt_id['delivered_val'] == '1') {
                                                echo "<span class='label label-info'>Delivered</span>";
                                            } elseif ($trouble_tt_id['delivered_val'] == '2') {
                                                echo "<span class='label label-warning'>Canceled</span>";
                                            }

                                            echo "</td>";

                                            echo "</tr>";
                                        }
                                        ?>
                                    </tbody>
                                    <tfoot style="background-color: lightgrey">
                                        <tr>
                                            <th>SL</th>
                                            <th>TicketNo</th>
                                            <th>Employee Name & ID</th>
                                            <th>Phone Number</th>
                                            <th>Query Type</th>
                                            <th>Desig and Dept (Assigned)</th>
                                            <th>Desig and Dept (Current)</th>
                                            <th>TT Age</th>
                                            <th>Responsible Person</th>
                                            <th>Created By</th>
                                            <th>Closed By</th>
                                            <th>Attach File</th>
                                            <th>Status</th>
                                            <th>Requisition</th>
                                            <th>Delivered Status</th>
                                        </tr>
                                    </tfoot>
                                </table>
                            <?php
                            } else echo "<div class='box box-danger' style='height: 50px; font-size: large; font-weight: bold; color: red;'>No data found!</div>";
                            ?>
                            <!-- </div> -->
                            <!-- /.table-responsive -->

                        </div>
                        <!-- /.box-body -->


                    </div>
                    <!-- /.row -->

    </section>
    <!-- /.content -->
</div>
<!-- /.content-wrapper -->
<!-- Control Sidebar -->

<?php include_once 'main_footer.php'; ?>

<script type="text/javascript">
    function lookup(inputString) {
        if (inputString.length == 0) {
            // Hide the suggestion box.
            $('#suggestions').hide();
        } else {
            $.post("cc/scr_list.php", {
                queryStringEmployee: "" + inputString + ""
            }, function(data) {
                if (data.length > 0) {
                    $('#suggestions').show();
                    $('#autoSuggestionsList').html(data);
                }
            });
        }
    } // lookup

    function fill(thisValue) {

        $('#client_name').val(thisValue);
        setTimeout("$('#suggestions').hide();", 200);
    }

    function fillData(thisValue) {
        //alert('thisValue');
        $('#employee_id').val(thisValue);
    }

    function clientFromAddress(thisValue) {
        $('#designation').val(thisValue);
    }

    function client_to_address(thisValue) {
        $('#depertment').val(thisValue);
    }

    function type_of_service(thisValue) {
        //alert('thisValue');
        $('#type_of_service').val(thisValue);
    }

    function core_capacity(thisValue) {
        $('#core_capacity').val(thisValue);
    }
</script>


<script>
    var table = $('#example1').dataTable({
        language: {
            searchPlaceholder: "Global Search"
        }
    });
</script>


<?php include_once 'view/linechart.php'; ?>