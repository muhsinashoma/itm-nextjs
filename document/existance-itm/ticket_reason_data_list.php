<?php
include_once 'main_header.php';

$control = new control();
$UserEmployeeInfo = $control->UserEmployeeInfo($_SESSION['eID']);

$it_usages_parts_category = $control->ITUsagesPartsCategory();

$it_responsible_person = $control->ITResponsiblePerson();



// $whereClauseDeviceCate = "status = 1 AND parent_id=0 $statement";
// $inventory_category_list = $control->fetchList('tbl_inventory_category', $whereClauseDeviceCate);


$whereClauseDeviceCate = "status = 1 AND parent_id=0 $statement";
$inventory_category_list = $control->fetchList(
    'tbl_inventory_category',
    $whereClauseDeviceCate,
    'inventory_category_list ASC',
    'GROUP BY inventory_category_list'
);



$_SESSION['eID'];


$mod_statement = str_replace("'", "*", $statement);


if (isset($_POST['btnSearch'])) {

    $statement = "";

    if ($_POST['category'] != "") {
        $statement .= " and tbl_tt_reason.category='$_POST[category]'";
    }

    if ($_POST['system_from'] != "" && $_POST['system_to'] != "") {
        $open_from = date('Y-m-d H:i:s', strtotime($_POST['system_from']));
        $open_to = date('Y-m-d H:i:s', strtotime($_POST['system_to']));
        $statement .= " and ((tbl_tt_reason.created_at between '$open_from' and '$open_to'))";
    }

    if ($_POST['approved_val'] != "") {
        $statement .= " and tbl_tt_reason.approved_val='$_POST[approved_val]'";
    }

    $mod_statement = str_replace("'", "*", $statement);
}


$statement;

$whereClause = "status = 1 $statement";

$allProblemInfo = $control->fetchList('tbl_tt_reason', $whereClause);

?>



<style>
    .select2-selection__choice {
        background-color: #5d5db1 !important;
        color: #fff;
    }

    .select2-selection__choice__remove {
        color: #fff !important;
    }
</style>

<style>
    .select2-container .select2-selection--single {
        height: 35px !important;
        line-height: 50px !important;
    }
</style>

<link rel="stylesheet" href="https://adminlte.io/themes/AdminLTE/bower_components/select2/dist/css/select2.min.css">



<title>Ticketing</title>

<!-- FixedHeader extension -->
<link rel="stylesheet" href="https://cdn.datatables.net/fixedheader/3.4.0/css/fixedHeader.dataTables.min.css">

<script>
    function deviceApproved(id) {
        window.open("view/ticket_reason_print_preview.php?id=" + id, "printwindow", "menubar=1,resizable=1,width=700,height=300");
    }
</script>

<div class="content-wrapper">
    <!-- Content Header (Page header) -->
    <section class="content-header">
        <h1>
            Search
            <small></small>
        </h1>
        <ol class="breadcrumb">
            <li><a href="#"><i class="fa fa-dashboard"></i> Home</a></li>
            <li><a href="#">IT Accessories</a></li>
            <li class="active">IT Accessories Requisition List </li>
        </ol>
    </section>

    <!-- Main content -->
    <section class="content">
        <div class="row">
            <div class="col-xs-12">

                <div class="box box-info">
                    <div class="box-header">

                        <!-- tools box -->
                        <div class="pull-right box-tools">
                            <button type="button" class="btn btn-info btn-sm" data-widget="collapse" data-toggle="tooltip" title="Minimize">
                                <i class="fa fa-minus"></i></button>
                        </div>
                        <!-- /. tools -->
                    </div>
                    <!-- /.box-header -->
                    <form method="post" id="frm1" action="" autocomplete="off" class="form-group">
                        <div class="box-body pad">
                            <div class="box-body">

                                <div class="form-group col-sm-2" style="display: none;">
                                    <label for="emp_name_id">Approval ID<b style="color: red">*</b></label>
                                    <input id="emp_name_id" type="text" value="<?php echo  $_SESSION['eID']; ?>" readonly></input>
                                </div>

                                <div class="form-group col-sm-2" style="display: none;">
                                    <label for="approved_date">Approved Date<b style="color: red">*</b></label>
                                    <input id="approved_date" type="text" value="<?php echo date('Y-m-d H:i:s'); ?>" readonly></input>
                                </div>


                                <div class="form-group col-sm-2">
                                    <div class="form-group">
                                        <label for="inventory_cate">Device Category </label>
                                        <select class="form-control select2" data-placeholder="Select Query Type" data-allow-clear="true" name="category" id="inventory_cate">
                                            <option value="">Select Query Type</option>
                                            <?php
                                            foreach ($inventory_category_list as $inventory_cate):
                                            ?>
                                                <option <?php if ($_POST['category'] == $inventory_cate['inventory_category_list']) {
                                                            echo 'selected="selected"';
                                                        } ?> value="<?php echo $inventory_cate['inventory_category_list'] ?>"><?php echo $inventory_cate['inventory_category_list'] ?></option>
                                            <?php
                                            endforeach;
                                            ?>
                                        </select>
                                    </div>
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


                                <div class="form-group col-sm-2">
                                    <label for="demo8">Approved Status</label>
                                    <select name="approved_val" id="approved_val" class="form-control input-sm">
                                        <option value="">-Select-</option>
                                        <option value="1" style="color: green;" <?php if (isset($_POST['approved_val']) && $_POST['approved_val'] == '1') echo 'selected'; ?>>
                                            Petty Cash (Approved)
                                        </option>
                                        <option value="3" style="color: #00c0ef;" <?php if (isset($_POST['approved_val']) && $_POST['approved_val'] == '3') echo 'selected'; ?>>
                                            PR (Approved)
                                        </option>
                                        <option value="2" style="color: red;" <?php if (isset($_POST['approved_val']) && $_POST['approved_val'] == '2') echo 'selected'; ?>>
                                            Rejected
                                        </option>

                                        <option value="0" style="color: gray;" <?php if (isset($_POST['approved_val']) && $_POST['approved_val'] == '0') echo 'selected'; ?>>
                                            Pending
                                        </option>
                                    </select>
                                </div>

                                <div class="form-group col-sm-2">
                                    <label for="responsible_person">Search</label>
                                    <br>
                                    <input type="submit" name="btnSearch" value="Search" class="btn btn-success">
                                </div>

                            </div>
                        </div>

                    </form>
                </div>


                <!-- /.box -->
                <div class="box box-info">
                    <div class="box-header">
                        <h3 class="box-title"> IT Accessories Requisition List</h3>
                    </div>
                    <!-- /.box-header -->
                    <div class="box-body" style="overflow-x: auto">
                        <table id="example1" class="table table-bordered table-striped small">
                            <thead>
                                <tr style="background-color: #e6e6e6">
                                    <th style="width:10px;">SL No.</th>
                                    <th>TT No.</th>
                                    <th style="display: none;">TT Unique ID</th>
                                    <th>Submitted Date</th>
                                    <th>Raised By </th>

                                    <th>Category</th>
                                    <th>Device SL</th>
                                    <th>User_Details</th>
                                    <th>Reason</th>

                                    <th>Approved Status</th>
                                    <th>Approved By</th>
                                    <th>Approved Date</th>

                                    <th>Delivered Status</th>
                                    <th>Delivered By</th>
                                    <th>Delivered Date</th>
                                    <th>Action</th>
                                </tr>
                            </thead>

                            <tbody>
                                <?php
                                $i = 1;
                                foreach ($allProblemInfo as $alt):
                                    $employee_details = $control->EmployeeDetails($alt['created_by']);
                                    $trouble_tt_id = $control->getDeviceApprovalDataTTPage($alt['tt_no']);
                                ?>
                                    <tr>
                                        <td><?php echo $i++; ?></td>

                                        <td class="tt_no_<?php echo $alt['id'] ?> no-export no-print"><a target="_blank" href='?e=pabx&p=all_list&f=all&l=view_new_tt&cc_id=<?php echo $trouble_tt_id['id'] ?>&list_m='><?php echo $alt['tt_no']; ?></a></td>

                                        <td style="display: none;" class="tt_unique_id_<?php echo $alt['id']; ?>"><?php echo $trouble_tt_id['id']; ?></td>

                                        <td><?php echo $alt['created_at']; ?></td>
                                        <td>
                                            <?php
                                            echo $alt['created_by'] . "<br>";
                                            echo $employee_details['employee_name'];
                                            ?>
                                        </td>

                                        <td><?php echo $alt['category']; ?></td>
                                        <td><?php echo $alt['device_sl_no']; ?></td>

                                        <td>
                                            <?php
                                            $employee_details = $control->EmployeeDetails($alt['employee_id']);
                                            echo $alt['employee_id'] . "<br>";
                                            echo $employee_details['employee_name'];
                                            ?>
                                        </td>

                                        <td><textarea style="border: 1px solid #ccc;text-align: center;" rows="2" readonly><?php echo trim($alt['reason_details']); ?></textarea></td>

                                        <td class="category_view_<?php echo $alt['id']; ?>">
                                            <?php
                                            if ($_SESSION['user_type'] == 1) {
                                            ?>
                                                <?php
                                                if ($alt['approved_val'] == '0') {
                                                ?>
                                                    <select name="category_value[]" id="category_value" class="category_value" onchange="categoryChangeValue(this);">
                                                        <option value="">-Select-</option>
                                                        <option value="1" data-id="<?php echo $alt['id']; ?>" style="color: #008000;">Petty Cash (Approved)</option>
                                                        <option value="3" data-id="<?php echo $alt['id']; ?>" style="color: #00c0ef">PR (Approved)</option>
                                                        <option value="2" data-id="<?php echo $alt['id']; ?>" style="color: #FF0000;">Rejected </option>
                                                    </select>

                                                <?php
                                                } elseif ($alt['approved_val'] == '1') {
                                                    echo '<span style="color: green; font-size: 10px;">&#10004;</span> <span style="color: green; font-size: 12px;">Petty Cash (Approved)</span>';
                                                } elseif ($alt['approved_val'] == '3') {
                                                    echo '<span style="color: #00c0ef; font-size: 10px;">&#10004;</span> <span style="color: #00c0ef; font-size: 12px;">PR (Approved)</span>';
                                                } elseif ($alt['approved_val'] == '2') {
                                                    echo '<span style="color: red; font-size: 10px;">&#10008;</span><span style="color:red"> Rejected</span>';
                                                }
                                                ?>

                                            <?php
                                            } elseif ($alt['approved_val'] == '1') {
                                                echo '<span style="color: green; font-size: 10px;">&#10004;</span> <span style="color: green; font-size: 12px;">Petty Cash (Approved)</span>';
                                            } elseif ($alt['approved_val'] == '3') {
                                                echo '<span style="color: #00c0ef; font-size: 10px;">&#4169E1;</span> <span style="color: #00c0ef; font-size: 12px;">PR (Approved)</span>';
                                            } elseif ($alt['approved_val'] == '2') {
                                                echo '<span style="color: red; font-size: 10px;">&#10008;</span><span style="color:red"> Rejected</span>';
                                            } else {
                                                echo '<span style="color: orange; font-size: 10px;">&#9203;</span> Pending';
                                            }
                                            ?>
                                        </td>

                                        <td class="appr_by_<?php echo $alt['id']; ?>">
                                            <?php

                                            if ($alt['approved_by'] != '') {
                                                echo $alt['approved_by'] . "<br>";
                                                $employee_details = $control->EmployeeDetails($alt['approved_by']);
                                                echo $employee_details['employee_name'];
                                            }
                                            ?>
                                        </td>

                                        <td class="appr_date_<?php echo $alt['id']; ?>">
                                            <?php
                                            if ($alt['approved_by'] != '') {
                                                echo $alt['approved_date'];
                                            }
                                            ?>
                                        </td>
                                        <td title="Delivered Status">
                                            <?php
                                            if ($alt['delivered_val'] == '1') {
                                                echo '<span style="color: green; font-size: 16px;">&#10004;</span>Delivered';
                                            } elseif ($alt['delivered_val'] == '2') {
                                                echo '<span style="color: red; font-size: 16px;">&#10008;</span>Cancel';
                                            }
                                            ?>
                                        </td>
                                        <td title="Delivered By">
                                            <?php
                                            $employee_details = $control->EmployeeDetails($alt['delivered_by']);
                                            if ($alt['delivered_val'] == '1') {
                                                echo $alt['delivered_by'] . "<br>";;
                                                echo $employee_details['employee_name'];
                                            } elseif ($alt['delivered_val'] == '2') {
                                                echo $alt['delivered_by'] . "<br>";;
                                                echo $employee_details['employee_name'];
                                            }
                                            ?>
                                        </td>
                                        <td title="Delivered Date">
                                            <?php
                                            if ($alt['delivered_val'] == '1') {
                                                echo $alt['delivered_date'];
                                            } elseif ($alt['delivered_val'] == '2') {
                                                echo $alt['delivered_date'];
                                            }
                                            ?>
                                        </td>

                                        <td class="no-export no-print">
                                            <div style="display: flex; gap: 5px;"> <!-- Flexbox container -->

                                                <?php echo "<a class='btn btn-success btn-xs' target='_blank'  href='' onClick='deviceApproved($alt[id])'>View</a>"; ?>

                                                <?php
                                                if ($alt['approved_val'] != '1' && $alt['approved_val'] != '3' && $alt['approved_val'] != '2') {
                                                ?>
                                                    <a class="btn btn-info btn-xs edit_button_<?php echo $alt['id']; ?>" href='?e=pabx&p=all_list&f=all&l=ticket_reason_update&id=<?php echo $alt['id'] ?>'>Edit</a>
                                                <?php
                                                }
                                                ?>
                                            </div>
                                        </td>
                                    </tr>
                                <?php
                                endforeach;
                                ?>
                            </tbody>


                        </table>
                    </div>
                    <!-- /.box-body -->
                </div>
                <!-- /.box -->
            </div>
            <!-- /.col -->
        </div>
        <!-- /.row -->
    </section>
    <!-- /.content -->
</div>

<?php include_once 'main_footer.php' ?>


<script type="text/javascript" src="js/dataTables.buttons.js"></script>
<script type="text/javascript" src="js/buttons.colVis.min.js"></script>
<script type="text/javascript" src="js/buttons.flash.js"></script>
<script type="text/javascript" src="js/jszip.min.js"></script>
<script type="text/javascript" src="js/pdfmake.js"></script>
<script type="text/javascript" src="js/vfs_fonts.js"></script>
<script type="text/javascript" src="js/buttons.html5.js"></script>
<script type="text/javascript" src="js/buttons.print.js"></script>
<script type="text/javascript" src="js/popper.min.js"></script>


<script type="text/javascript" charset="utf-8"></script>


<script src="https://adminlte.io/themes/AdminLTE/bower_components/select2/dist/js/select2.full.min.js"></script>


<script>
    $('.select2').select2();

    function others() {
        if (document.getElementById("alll").style.display == 'none') {
            document.getElementById("alll").style.display = '';
        } else {
            document.getElementById("alll").style.display = 'none';
        }
    }
</script>


<script>
    $(document).ready(function() {
        // Set font size of the table body
        $('#example1').css('font-size', '11px');

        $('#example1').DataTable({
            language: {
                searchPlaceholder: "Global Search"
            },
            responsive: true,
            scrollX: true,
            scrollCollapse: true,
            dom: 'lBfrtip',
            buttons: [{
                    extend: 'excelHtml5',
                    text: 'Export To Excel',
                    title: 'IT Accessories Requisition List',
                    action: function(e, dt, button, config) {
                        $('.view-button').hide();
                        $.fn.dataTable.ext.buttons.excelHtml5.action.call(this, e, dt, button, config);
                        setTimeout(function() {
                            $('.view-button').show();
                        }, 500);
                    },
                    exportOptions: {
                        columns: function(idx, data, node) {
                            var total = $('#example1 thead th').length;
                            return idx !== 2 && idx !== total - 1; // Exclude 2nd and last column
                        }
                    }
                },
                {
                    extend: 'pdfHtml5',
                    text: 'Export To PDF',
                    title: 'IT Accessories Requisition List',
                    action: function(e, dt, button, config) {
                        $('.view-button').hide();
                        $.fn.dataTable.ext.buttons.pdfHtml5.action.call(this, e, dt, button, config);
                        setTimeout(function() {
                            $('.view-button').show();
                        }, 500);
                    },
                    exportOptions: {
                        columns: function(idx, data, node) {
                            var total = $('#example1 thead th').length;
                            return idx !== 2 && idx !== total - 1; // Exclude 2nd and last column
                        }
                    },


                    customize: function(doc) {
                        const device_category = $('#inventory_cate').val();
                        const demo7 = $('#demo7').val();
                        const demo8 = $('#demo8').val();

                        let headerText = 'IT Accessories Requisition List\n\n';
                        if (device_category) headerText += `Device Category: ${device_category}\n`;
                        if (demo7) headerText += `From Date: ${demo7} `;
                        if (demo8) headerText += `To Date: ${demo8}\n`;

                        doc.content[0].text = headerText;
                        doc.pageSize = 'LEGAL';
                        doc.pageOrientation = 'landscape';
                        doc.pageMargins = [20, 40, 20, 40];

                        doc.defaultStyle = {
                            fontSize: 9
                        };

                        doc.styles.tableHeader = {
                            bold: true,
                            fontSize: 10,
                            color: 'black',
                            fillColor: '#e6e6e6',
                            alignment: 'center'
                        };

                        doc.styles.tableBodyEven = {
                            fontSize: 9,
                            alignment: 'center'
                        };
                        doc.styles.tableBodyOdd = {
                            fontSize: 9,
                            alignment: 'center'
                        };


                        if (doc.content[1] && doc.content[1].table) {
                            doc.content[1].table.widths = [
                                30, 70, 80, 60, 60, 60,
                                100, 130, 90, 80, 80,
                                80, 80, 80
                            ];

                            doc.content[1].table.body.forEach(function(row) {
                                row.forEach(function(cell) {
                                    if (typeof cell === 'object' && cell.text) {
                                        cell.alignment = 'left';
                                        cell.fontSize = 7;
                                    }
                                });
                            });
                        }


                    }

                }
            ],
            initComplete: function() {
                const sumButton = $('<button>', {
                    text: 'Requisition Summary',
                    style: 'margin-left: 10px;',
                    class: 'btn btn-primary',
                    click: function() {
                        // window.open('?e=pabx&p=all_list&f=all&l=ticket_reason_device_sum', '_blank');

                        window.open('?e=pabx&p=all_list&f=all&l=ticket_reason_raised_total', '_blank');
                    }
                });

                const approvedButton = $('<button>', {
                    text: 'Approval Pending',
                    style: 'margin-left: 10px;',
                    class: 'btn btn-success',
                    click: function() {
                        window.open('?e=pabx&p=all_list&f=all&l=ticket_reason_device_approved_pending', '_blank');
                    }
                });

                const rejectedButton = $('<button>', {
                    text: 'Rejected',
                    style: 'margin-left: 10px;',
                    class: 'btn btn-danger',
                    click: function() {
                        window.open('?e=pabx&p=all_list&f=all&l=ticket_reason_device_rejected', '_blank');
                    }
                });

                $('.dt-buttons').append(sumButton, approvedButton, rejectedButton);
            }
        });
    });
</script>


<script>
    function categoryChangeValue(thisCategoryValue) {
        let previousValue = thisCategoryValue.getAttribute('data-previous') || '';
        let opt = thisCategoryValue.options[thisCategoryValue.selectedIndex];
        let id = opt.dataset.id;
        let categoryValue = thisCategoryValue.value;
        let emp_id = document.getElementById('emp_name_id').value;
        let approvedDate = document.getElementById('approved_date').value;

        let tt_num = document.querySelector('.tt_no_' + id + ' a')?.textContent;
        let tt_unique_id = document.querySelector('.tt_unique_id_' + id).innerText;

        let actionConfirmed = false;

        if (categoryValue == '1') {
            actionConfirmed = confirm('Are you sure you want to approve this ticket as Petty Cash?');
        } else if (categoryValue == '3') {
            actionConfirmed = confirm('Are you sure you want to approve this ticket as PR?');
        } else if (categoryValue == '2') {
            actionConfirmed = confirm('Are you sure you want to reject this ticket?');
        } else {
            actionConfirmed = true;
        }

        // Handle Cancel Action
        if (!actionConfirmed) {
            alert('You canceled the action. No changes were made.');
            thisCategoryValue.value = previousValue; // Reset dropdown to previous value
            return;
        }

        // AJAX Request to update status
        $.ajax({
            url: "view/ticket_reason_approved_status.php",
            type: "POST",
            data: {
                id: id,
                categoryValue: categoryValue,
                emp_id: emp_id,
                tt_num: tt_num,
                tt_unique_id: tt_unique_id
            },
            success: function(result) {
                let catId = ".category_view_" + id;
                let statusText = "";
                let color = "orange"; // Default color for pending

                if (categoryValue == '1') {
                    statusText = "✔ Petty Cash (Approved)";
                    color = "green";
                } else if (categoryValue == '3') {
                    statusText = "✔ PR (Approved)";
                    color = "#00c0ef";
                } else if (categoryValue == '2') {
                    statusText = "✘ Rejected";
                    color = "red";
                } else {
                    statusText = "⏳ Pending";
                }

                $(catId).html(`<span style="color: ${color}; font-size: 10px;">${statusText}</span>`);

                $(".appr_by_" + id).text(emp_id);
                $(".appr_date_" + id).text(approvedDate);
                $(".edit_button_" + id).hide(); // Hide edit button after approval

                // Update previous value after successful change
                thisCategoryValue.setAttribute('data-previous', categoryValue);
            },
            error: function() {
                alert('An error occurred while updating the status.');
            }
        });
    }


    // Store the initial value when the page loads
    $(document).ready(function() {
        $('select').each(function() {
            $(this).attr('data-previous', this.value);
        });
    });
</script>

<script>
    const select = document.getElementById('approved_val');

    function updateColor() {
        const val = select.value;
        if (val === "1") {
            select.style.color = "green";
        } else if (val === "3") {
            select.style.color = "#00c0ef";
        } else if (val === "2") {
            select.style.color = "red";
        } else {
            select.style.color = "#000"; // default color
        }
    }

    // Trigger on load and when changed
    window.addEventListener('DOMContentLoaded', updateColor);
    select.addEventListener('change', updateColor);
</script>