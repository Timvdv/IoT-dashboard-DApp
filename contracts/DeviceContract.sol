pragma solidity ^0.4.17;

contract DeviceContract {
    using SafeMath for uint256;
    
    event DeviceCreated(uint256 tokenId, string name, address owner);    
    event Transfer(address indexed from, address indexed to, uint256 tokenId);
    event Trigger(uint256 tokenId, int state); 
    
    address public ceoAddress;
    
    uint256 private totalDevices;
    
    struct Device {
        address owner;
        string deviceName;
        string deviceType;
        int state;
    }
    
    Device[] private devices;
    
    function DeviceContract() public {
        ceoAddress = msg.sender;
    }
    
    /// @dev A mapping from drawings IDs to the address that owns them. All devices have
    ///  some valid owner address.
    mapping (uint256 => address) public deviceIndexToOwner;    

    /// @dev A mapping from deviceId to an address that has been approved to call
    ///  transferFrom(). Each device can only have one approved address for transfer
    ///  at any time. A zero value means no approval is outstanding.
    mapping (uint256 => address) public deviceIndexToApproved;
    
    // @dev A mapping from owner address to count of tokens that address owns.
    //  Used internally inside balanceOf() to resolve ownership count.
    mapping (address => uint256) ownershipTokenCount;    

    /**
    * @dev Gets the total amount of tokens stored by the contract
    * @return uint256 representing the total amount of tokens
    */
    function totalSupply() public view returns (uint256) {
        return totalDevices;
    }

    function addDevice(string _name) public {
        _createDevice(_name, msg.sender);
    }
    
    function _createDevice(string _name, address _owner) private {
        Device memory _device = Device({
            owner: _owner,
            deviceName: _name,
            deviceType: "lightbulb",
            state: 0
        });
        
        uint256 newDeviceId = devices.push(_device) - 1;
        
        
        // It's probably never going to happen, 4 billion tokens are A LOT, but
        // let's just be 100% sure we never let this happen.
        require(newDeviceId == uint256(uint32(newDeviceId)));
        
        emit DeviceCreated(newDeviceId, _name, _owner);
        
        // This will assign ownership, and also emit the Transfer event as
        // per ERC721 draft
        _transfer(address(0), _owner, newDeviceId);        
        
        totalDevices = totalDevices.add(1);
    }
    
    function _transfer(address _from, address _to, uint256 _tokenId) private {
        //transfer ownership
        deviceIndexToOwner[_tokenId] = _to;
        ownershipTokenCount[_to]++;

        // When creating new drawing _from is 0x0, but we can't account that address.
        if (_from != address(0)) {
            ownershipTokenCount[_from]--;
            // clear any previously approved ownership exchange
            delete deviceIndexToApproved[_tokenId];
        }

        // Emit the transfer event.
        emit Transfer(_from, _to, _tokenId);        
    }
    
    function balanceOf(address _owner) public view returns (uint256 count) {
        return ownershipTokenCount[_owner];
    }
    
    function tokensOfOwner(address _owner) external view returns(uint256[] ownerTokens) {
        uint256 tokenCount = balanceOf(_owner);

        if (tokenCount == 0) {
            // Return an empty array
            return new uint256[](0);
        } else {
            uint256[] memory result = new uint256[](tokenCount);
            uint256 resultIndex = 0;

            // We count on the fact that all cats have IDs starting at 1 and increasing
            // sequentially up to the totalCat count.
            uint256 deviceId;

            for (deviceId = 1; deviceId <= totalDevices; deviceId++) {
                if (deviceIndexToOwner[deviceId] == _owner) {
                    result[resultIndex] = deviceId;
                    resultIndex++;
                }
            }

            return result;
        }
    }
    
    function getDevice(uint256 _id)
        external
        view
        returns (
        address owner,
        string deviceName,
        string deviceType,
        int state
    ) {
        Device storage device = devices[_id];
        
        owner = device.owner;
        deviceName = device.deviceName;
        deviceType = device.deviceType;
        state = device.state;
    }    
    
    function tiggerDevice(uint256 _id, int _state) public {
        
        devices[_id].state = _state;
        
        emit Trigger(_id, _state);
    }      
}

/**
 * @title SafeMath
 * @dev Math operations with safety checks that throw on error
 */
library SafeMath {

  /**
  * @dev Multiplies two numbers, throws on overflow.
  */
  function mul(uint256 a, uint256 b) internal pure returns (uint256) {
    if (a == 0) {
      return 0;
    }
    uint256 c = a * b;
    assert(c / a == b);
    return c;
  }

  /**
  * @dev Integer division of two numbers, truncating the quotient.
  */
  function div(uint256 a, uint256 b) internal pure returns (uint256) {
    // assert(b > 0); // Solidity automatically throws when dividing by 0
    uint256 c = a / b;
    // assert(a == b * c + a % b); // There is no case in which this doesn't hold
    return c;
  }

  /**
  * @dev Subtracts two numbers, throws on overflow (i.e. if subtrahend is greater than minuend).
  */
  function sub(uint256 a, uint256 b) internal pure returns (uint256) {
    assert(b <= a);
    return a - b;
  }

  /**
  * @dev Adds two numbers, throws on overflow.
  */
  function add(uint256 a, uint256 b) internal pure returns (uint256) {
    uint256 c = a + b;
    assert(c >= a);
    return c;
  }
}