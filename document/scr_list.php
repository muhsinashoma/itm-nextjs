<?php

include_once '../control/control.php';
include_once '../model/model.php';

$control = new control();
if (isset($_POST['queryString'])) {
    $alterEmployee = $control->scr_list($_POST['queryString']);


    foreach ($alterEmployee as $altEmp):
        echo '<li class="list-group-item" style="min-width:240px;" onClick="fill(\'' . $altEmp[0] . '\');fillData(\'' . $altEmp[1] . '\');clientFromAddress(\'' . $altEmp[2] . '\');client_to_address(\'' . $altEmp[3] . '\');type_of_service(\'' . $altEmp[6] . '\');core_capacity(\'' . $altEmp[5] . '\'); userFunction(\'' . $altEmp[8] . '\'); deviceType(\'' . $altEmp[1] . '\'); deviceSerialNo(\'' . $altEmp[10] . '\'); receiverName(\'' . $altEmp[11] . '\'); receiverID(\'' . $altEmp[12] . '\'); receiverFunction(\'' . $altEmp[13] . '\'); receiverDept(\'' . $altEmp[14] . '\'); "><table><tr><td><img height="30px" width="30px" class=\'img img-circle\' src=\'https://hris.fiberathome.net/hris/admin/' . $altEmp[7] . '\'></td><td>&nbsp;&nbsp;&nbsp;</td><td>' . $altEmp[0] . '<br><label style="color: gray">' . $altEmp[3] . '</label></td></tr></table></li>';
    endforeach;
} elseif (isset($_POST['queryStringEmployee'])) {
    $alterEmployee = $control->scr_list_employee($_POST['queryStringEmployee']);

    foreach ($alterEmployee as $altEmp):

        echo '<li class="list-group-item" style="min-width:240px;" 
          onClick="fill(\'' . $altEmp[0] . '\');fillData(\'' . $altEmp[1] . '\');clientFromAddress(\'' . $altEmp[2] . '\');client_to_address(\'' . $altEmp[3] . '\');type_of_service(\'' . $altEmp[6] . '\');core_capacity(\'' . $altEmp[5] . '\');">
          <table>
              <tr>
                  <td>
                      <img height="30px" width="30px" class="img img-circle" 
                           src="https://hris.fiberathome.net/hris/admin/' . $altEmp[7] . '">
                  </td>
                  <td>&nbsp;&nbsp;&nbsp;</td>
                  <td>' . $altEmp[0] . ' (' . $altEmp[1] . ')<br>
                      <label style="color: gray">' . $altEmp[3] . '</label>
                  </td>
              </tr>
          </table>
      </li>';

    endforeach;
} elseif (isset($_POST['mngString'])) {
    $alterEmployee = $control->scr_list($_POST['mngString']);

    foreach ($alterEmployee as $altEmp):
        echo '<li class="list-group-item" onClick="LineManagerFill(\'' . $altEmp[0] . '\');">' . $altEmp[0] . '</li>';
    endforeach;
}
